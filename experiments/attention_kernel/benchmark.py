"""
benchmark.py — Side-by-side performance comparison:

    Version                 │ Memory model  │ Kernel
    ────────────────────────┼───────────────┼──────────────────────
    Naive (simulated)       │ O(N²) HBM     │ PyTorch ATen ops
    Flash Attention (real)  │ O(N)  HBM     │ Triton fused kernel
    PyTorch SDPA (baseline) │ O(N²) or O(N) │ cuDNN / Flash backend

Metrics collected for each (seq_len, batch_size) configuration:
  • Median latency  (ms)
  • Throughput      (TFLOPS)
  • Peak GPU memory (MB)
  • Speedup over naive

Run:
    python benchmark.py                         # GPU only
    python benchmark.py --cpu-only              # CPU simulation only
    python benchmark.py --seq 512 1024 2048     # custom sequence lengths

Requires: torch  (triton optional but recommended on CUDA)
"""

import argparse
import math
import time
import sys
import os

import torch
import torch.nn.functional as F

# Make the experiment package importable when run from any cwd
sys.path.insert(0, os.path.dirname(__file__))

from naive_attention import naive_attention, naive_attention_memory_bytes

try:
    from triton_flash_attention import flash_attention, flash_attention_memory_bytes
    HAS_TRITON = True
except (ImportError, RuntimeError):
    HAS_TRITON = False


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def attention_flops(B: int, H: int, N: int, d: int) -> int:
    """
    FLOPs for one forward pass of scaled dot-product attention.
    Two matmuls dominate:
        QKᵀ  : 2 * B * H * N * N * d
        AV   : 2 * B * H * N * N * d
    """
    return 4 * B * H * N * N * d


def timed_run(fn, n_warmup: int = 5, n_bench: int = 20,
              device: str = "cuda") -> tuple[float, float]:
    """
    Return (median_ms, std_ms) for fn().
    Uses CUDA events when device=='cuda', else time.perf_counter.
    """
    # Warm-up
    for _ in range(n_warmup):
        fn()

    timings = []
    if device == "cuda":
        for _ in range(n_bench):
            torch.cuda.synchronize()
            start = torch.cuda.Event(enable_timing=True)
            end   = torch.cuda.Event(enable_timing=True)
            start.record()
            fn()
            end.record()
            torch.cuda.synchronize()
            timings.append(start.elapsed_time(end))
    else:
        for _ in range(n_bench):
            t0 = time.perf_counter()
            fn()
            timings.append((time.perf_counter() - t0) * 1e3)

    timings_t = torch.tensor(timings, dtype=torch.float32)
    return timings_t.median().item(), timings_t.std().item()


def peak_memory_mb(fn, device: str) -> float:
    """Run fn() and return peak GPU memory allocated in MB (0 on CPU)."""
    if device != "cuda":
        return 0.0
    torch.cuda.reset_peak_memory_stats()
    fn()
    torch.cuda.synchronize()
    return torch.cuda.max_memory_allocated() / 1e6


def print_table(rows: list[dict], title: str):
    col_order = ["version", "seq_len", "batch", "latency_ms",
                 "tflops", "peak_mem_mb", "speedup"]
    col_fmt = {
        "version":     ("Version",         "<22"),
        "seq_len":     ("SeqLen",          ">7"),
        "batch":       ("B",               ">3"),
        "latency_ms":  ("Latency (ms)",    ">13"),
        "tflops":      ("TFLOPS",          ">8"),
        "peak_mem_mb": ("PeakMem (MB)",    ">13"),
        "speedup":     ("Speedup",         ">8"),
    }

    header = "  ".join(f"{col_fmt[c][0]:{col_fmt[c][1]}}" for c in col_order)
    sep    = "  ".join("-" * max(len(col_fmt[c][0]), 7) for c in col_order)

    print(f"\n{'═'*len(sep)}")
    print(f"  {title}")
    print(f"{'═'*len(sep)}")
    print(header)
    print(sep)
    for r in rows:
        line_parts = []
        for c in col_order:
            v = r.get(c, "—")
            fmt = col_fmt[c][1]
            if isinstance(v, float):
                align = fmt[0]           # '<' or '>'
                width = int(fmt[1:])     # numeric width from e.g. ">13"
                line_parts.append(f"{v:{align}{width}.3f}")
            else:
                line_parts.append(f"{v:{fmt}}")
        print("  ".join(line_parts))
    print(f"{'═'*len(sep)}\n")


# ─────────────────────────────────────────────────────────────────────────────
# Core benchmark loop
# ─────────────────────────────────────────────────────────────────────────────

def run_benchmark(seq_lens, batch_size, n_heads, head_dim, causal,
                  device, n_warmup, n_bench, skip_oom):

    rows = []

    for N in seq_lens:
        B, H, d = batch_size, n_heads, head_dim
        dtype = torch.float16 if device == "cuda" else torch.float32
        print(f"\n[seq_len={N:5d}  B={B}  H={H}  d={d}  causal={causal}  device={device}]")

        def make_tensors():
            q = torch.randn(B, H, N, d, dtype=dtype, device=device)
            k = torch.randn(B, H, N, d, dtype=dtype, device=device)
            v = torch.randn(B, H, N, d, dtype=dtype, device=device)
            return q, k, v

        flops = attention_flops(B, H, N, d)

        # ── 1. Naive attention ────────────────────────────────────────────
        try:
            q, k, v = make_tensors()
            fn_naive = lambda: naive_attention(q, k, v, causal=causal)
            fn_naive()  # OOM probe

            mem_naive   = peak_memory_mb(fn_naive, device)
            lat_naive, _= timed_run(fn_naive, n_warmup, n_bench, device)
            tflops_naive = flops / (lat_naive * 1e-3) / 1e12

            rows.append(dict(
                version="Naive (simulated)",
                seq_len=N, batch=B,
                latency_ms=lat_naive,
                tflops=tflops_naive,
                peak_mem_mb=mem_naive,
                speedup=1.0,
            ))
            print(f"  Naive          {lat_naive:8.3f} ms  {tflops_naive:6.3f} TFLOPS  {mem_naive:7.1f} MB")
            naive_lat = lat_naive
        except torch.cuda.OutOfMemoryError:
            print(f"  Naive          OOM  (N={N} too large for naive on this GPU)")
            naive_lat = None
            if skip_oom:
                continue

        # ── 2. Flash Attention (Triton) ────────────────────────────────────
        if HAS_TRITON and device == "cuda":
            try:
                q, k, v = make_tensors()
                fn_flash = lambda: flash_attention(q, k, v, causal=causal)
                fn_flash()  # compile + OOM probe

                mem_flash    = peak_memory_mb(fn_flash, device)
                lat_flash, _ = timed_run(fn_flash, n_warmup, n_bench, device)
                tflops_flash  = flops / (lat_flash * 1e-3) / 1e12
                speedup       = (naive_lat / lat_flash) if naive_lat else float("nan")

                rows.append(dict(
                    version="Flash Attn (Triton)",
                    seq_len=N, batch=B,
                    latency_ms=lat_flash,
                    tflops=tflops_flash,
                    peak_mem_mb=mem_flash,
                    speedup=speedup,
                ))
                print(f"  Flash (Triton) {lat_flash:8.3f} ms  {tflops_flash:6.3f} TFLOPS  {mem_flash:7.1f} MB"
                      f"  {speedup:.2f}× faster")
            except Exception as e:
                print(f"  Flash (Triton) ERROR: {e}")

        # ── 3. PyTorch SDPA (reference) ────────────────────────────────────
        try:
            q, k, v = make_tensors()
            fn_sdpa = lambda: F.scaled_dot_product_attention(
                q, k, v, is_causal=causal
            )
            fn_sdpa()

            mem_sdpa    = peak_memory_mb(fn_sdpa, device)
            lat_sdpa, _ = timed_run(fn_sdpa, n_warmup, n_bench, device)
            tflops_sdpa  = flops / (lat_sdpa * 1e-3) / 1e12
            speedup_sdpa = (naive_lat / lat_sdpa) if naive_lat else float("nan")

            rows.append(dict(
                version="PyTorch SDPA (ref)",
                seq_len=N, batch=B,
                latency_ms=lat_sdpa,
                tflops=tflops_sdpa,
                peak_mem_mb=mem_sdpa,
                speedup=speedup_sdpa,
            ))
            print(f"  PyTorch SDPA   {lat_sdpa:8.3f} ms  {tflops_sdpa:6.3f} TFLOPS  {mem_sdpa:7.1f} MB"
                  f"  {speedup_sdpa:.2f}× faster")
        except Exception as e:
            print(f"  PyTorch SDPA   ERROR: {e}")

    return rows


# ─────────────────────────────────────────────────────────────────────────────
# Memory-scaling analysis (demonstrates O(N²) vs O(N))
# ─────────────────────────────────────────────────────────────────────────────

def print_memory_scaling(seq_lens, B, H, d):
    print("\nTheoretical HBM footprint comparison")
    print(f"{'SeqLen':>8}  {'Naive (MB)':>12}  {'Flash (MB)':>12}  {'Ratio':>8}")
    print("-" * 50)
    for N in seq_lens:
        naive_mb = naive_attention_memory_bytes(B, H, N, d) / 1e6
        flash_mb = flash_attention_memory_bytes(B, H, N, d) / 1e6
        ratio    = naive_mb / flash_mb
        print(f"{N:>8}  {naive_mb:>12.1f}  {flash_mb:>12.1f}  {ratio:>8.1f}×")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Attention kernel benchmark")
    parser.add_argument("--seq",      type=int, nargs="+",
                        default=[256, 512, 1024, 2048, 4096],
                        help="Sequence lengths to benchmark")
    parser.add_argument("--batch",    type=int, default=2,  help="Batch size")
    parser.add_argument("--heads",    type=int, default=8,  help="Number of heads")
    parser.add_argument("--dim",      type=int, default=64, help="Head dim")
    parser.add_argument("--causal",   action="store_true",  help="Causal mask")
    parser.add_argument("--warmup",   type=int, default=5,  help="Warmup iters")
    parser.add_argument("--iters",    type=int, default=20, help="Bench iters")
    parser.add_argument("--cpu-only", action="store_true",  help="Force CPU (float32, no Triton)")
    parser.add_argument("--skip-oom", action="store_true",  help="Skip seq_lens that OOM on naive")
    args = parser.parse_args()

    if args.cpu_only or not torch.cuda.is_available():
        device = "cpu"
        if not args.cpu_only:
            print("WARNING: No CUDA device found — falling back to CPU (float32, Triton disabled).")
    else:
        device = "cuda"
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"     {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB VRAM")

    print(f"Triton available: {HAS_TRITON and device == 'cuda'}")

    # Memory scaling table (theoretical)
    print_memory_scaling(args.seq, args.batch, args.heads, args.dim)

    # Timed benchmark
    rows = run_benchmark(
        seq_lens  = args.seq,
        batch_size= args.batch,
        n_heads   = args.heads,
        head_dim  = args.dim,
        causal    = args.causal,
        device    = device,
        n_warmup  = args.warmup,
        n_bench   = args.iters,
        skip_oom  = args.skip_oom,
    )

    if rows:
        print_table(rows, "Attention kernel benchmark results")

    # Human-readable summary
    naive_rows = [r for r in rows if r["version"].startswith("Naive")]
    flash_rows = [r for r in rows if r["version"].startswith("Flash")]
    if naive_rows and flash_rows:
        avg_speedup = sum(r["speedup"] for r in flash_rows) / len(flash_rows)
        print(f"Average Flash-Attn speedup over Naive: {avg_speedup:.2f}×")


if __name__ == "__main__":
    main()
