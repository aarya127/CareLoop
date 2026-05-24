"""
triton_flash_attention.py — Flash Attention implemented as a Triton kernel.

Algorithm: Dao et al., "FlashAttention: Fast and Memory-Efficient Exact
Attention with IO-Awareness" (NeurIPS 2022).  arXiv:2205.14135

Key insight vs. naive attention
────────────────────────────────
Naive:  loads Q, K, V → writes full N×N score matrix to HBM → loads it back
        for softmax → writes attention weights → loads them for final matmul.
        HBM reads/writes ∝ N².

Flash:  tiles Q in BLOCK_M chunks.  For each tile it loops over all K/V tiles
        (BLOCK_N), accumulates a running softmax correction factor (m, ℓ),
        and writes only the final output — never materialising the N×N matrix.
        HBM reads/writes ∝ N  (linear!).

Triton kernel structure
────────────────────────
Each program handles one (batch, head, query-tile) triple.
    pid_m  — which BLOCK_M tile of Q we own
    pid_zh — encodes (batch_idx, head_idx)

Within the kernel:
    1. Load q_tile  (BLOCK_M × d)
    2. Iterate over k/v tiles  (BLOCK_N × d each):
          a. Compute s = q_tile @ k_tile.T  / sqrt(d)
          b. Causal mask if requested
          c. Online-softmax update: new_m = max(m, rowmax(s))
                                    ℓ     = exp(m-new_m)*ℓ + rowsum(exp(s-new_m))
          d. Accumulate: acc = exp(m-new_m)*acc + exp(s-new_m) @ v_tile
    3. Divide acc by ℓ (normalise)
    4. Write output tile
"""

import math
import torch

try:
    import triton
    import triton.language as tl
    HAS_TRITON = True
except ImportError:
    HAS_TRITON = False

# ---------------------------------------------------------------------------
# Triton forward kernel
# ---------------------------------------------------------------------------

if HAS_TRITON:

    @triton.jit
    def _flash_attn_fwd(
        # ── Pointers ──────────────────────────────────────────────────────
        Q_ptr, K_ptr, V_ptr, Out_ptr,
        # ── Strides (pre-computed for strided pointer arithmetic) ─────────
        stride_qb, stride_qh, stride_qm, stride_qd,
        stride_kb, stride_kh, stride_kn, stride_kd,
        stride_vb, stride_vh, stride_vn, stride_vd,
        stride_ob, stride_oh, stride_om, stride_od,
        # ── Dimensions ────────────────────────────────────────────────────
        B, H, N,
        scale,          # 1/sqrt(d) — passed as float32 constexpr
        causal: tl.constexpr,
        # ── Tile sizes (must be powers of 2) ─────────────────────────────
        BLOCK_M:    tl.constexpr,   # query tile rows
        BLOCK_N:    tl.constexpr,   # key/value tile rows
        BLOCK_D:    tl.constexpr,   # head dim (padded to next pow2)
    ):
        # ── Which (batch, head, query-tile) does this program own? ────────
        pid_m  = tl.program_id(0)          # query-tile index
        pid_bh = tl.program_id(1)          # flattened batch×head index
        pid_b  = pid_bh // H
        pid_h  = pid_bh  % H

        # ── Base pointer for this (b, h) slice ────────────────────────────
        Q_bh = Q_ptr   + pid_b * stride_qb + pid_h * stride_qh
        K_bh = K_ptr   + pid_b * stride_kb + pid_h * stride_kh
        V_bh = V_ptr   + pid_b * stride_vb + pid_h * stride_vh
        O_bh = Out_ptr + pid_b * stride_ob + pid_h * stride_oh

        # ── Offsets for this query tile ────────────────────────────────────
        offs_m = pid_m * BLOCK_M + tl.arange(0, BLOCK_M)  # (BLOCK_M,)
        offs_d = tl.arange(0, BLOCK_D)                     # (BLOCK_D,)

        # ── Load q tile: (BLOCK_M, BLOCK_D) ──────────────────────────────
        q_mask = offs_m[:, None] < N
        q = tl.load(
            Q_bh + offs_m[:, None] * stride_qm + offs_d[None, :] * stride_qd,
            mask=q_mask, other=0.0,
        )   # shape (BLOCK_M, BLOCK_D)

        # ── Running statistics for online softmax ─────────────────────────
        m_i = tl.full((BLOCK_M,), float("-inf"), dtype=tl.float32)   # row max
        l_i = tl.zeros((BLOCK_M,),               dtype=tl.float32)   # row sum
        acc  = tl.zeros((BLOCK_M, BLOCK_D),       dtype=tl.float32)  # output

        # ── Loop over K / V tiles ──────────────────────────────────────────
        # causal: only attend to positions ≤ current query position
        kv_end = (pid_m + 1) * BLOCK_M if causal else N
        for j in range(0, kv_end, BLOCK_N):
            offs_n = j + tl.arange(0, BLOCK_N)     # (BLOCK_N,)

            # load k tile  (BLOCK_N, BLOCK_D)
            kv_mask = offs_n[:, None] < N
            k = tl.load(
                K_bh + offs_n[:, None] * stride_kn + offs_d[None, :] * stride_kd,
                mask=kv_mask, other=0.0,
            )

            # s = q @ kᵀ * scale                shape (BLOCK_M, BLOCK_N)
            s = tl.dot(q, tl.trans(k)) * scale

            # causal mask: positions > current token → −∞
            if causal:
                causal_mask = offs_m[:, None] >= offs_n[None, :]
                s = tl.where(causal_mask, s, float("-inf"))

            # out-of-bounds columns → -inf
            s = tl.where(offs_n[None, :] < N, s, float("-inf"))

            # online softmax: update m, l, acc
            m_new = tl.maximum(m_i, tl.max(s, axis=1))
            alpha  = tl.exp(m_i  - m_new)    # (BLOCK_M,)  correction factor
            beta   = tl.exp(s - m_new[:, None])              # (BLOCK_M, BLOCK_N)

            # load v tile  (BLOCK_N, BLOCK_D)
            v = tl.load(
                V_bh + offs_n[:, None] * stride_vn + offs_d[None, :] * stride_vd,
                mask=kv_mask, other=0.0,
            )

            acc  = alpha[:, None] * acc  + tl.dot(beta.to(v.dtype), v)
            l_i  = alpha * l_i + tl.sum(beta, axis=1)
            m_i  = m_new

        # ── Normalise and write output ─────────────────────────────────────
        out = acc / l_i[:, None]
        tl.store(
            O_bh + offs_m[:, None] * stride_om + offs_d[None, :] * stride_od,
            out.to(tl.float16),
            mask=q_mask,
        )


# ---------------------------------------------------------------------------
# Python wrapper — same signature as naive_attention()
# ---------------------------------------------------------------------------

def flash_attention(q: torch.Tensor, k: torch.Tensor, v: torch.Tensor,
                    causal: bool = False) -> torch.Tensor:
    """
    Flash Attention via a single Triton kernel.

    Args:
        q, k, v: (B, H, N, d) float16 tensors on CUDA
        causal:  autoregressive mask
    Returns:
        out: (B, H, N, d) float16
    """
    if not HAS_TRITON:
        raise RuntimeError(
            "triton is not installed.  Install with:  pip install triton"
        )

    B, H, N, d = q.shape
    assert q.is_cuda, "flash_attention requires CUDA tensors"
    assert q.dtype == torch.float16, "flash_attention expects float16"
    assert q.is_contiguous() and k.is_contiguous() and v.is_contiguous()

    # Pad head-dim to next power-of-two for the kernel constexpr
    BLOCK_D = triton.next_power_of_2(d)
    BLOCK_M = 64    # query tile size  (tune per GPU)
    BLOCK_N = 64    # key/val tile size (tune per GPU)
    scale   = 1.0 / math.sqrt(d)

    out = torch.empty_like(q)

    # grid: (num_query_tiles, B * H)
    grid = (triton.cdiv(N, BLOCK_M), B * H)

    _flash_attn_fwd[grid](
        q, k, v, out,
        q.stride(0), q.stride(1), q.stride(2), q.stride(3),
        k.stride(0), k.stride(1), k.stride(2), k.stride(3),
        v.stride(0), v.stride(1), v.stride(2), v.stride(3),
        out.stride(0), out.stride(1), out.stride(2), out.stride(3),
        B, H, N,
        scale,
        causal,
        BLOCK_M, BLOCK_N, BLOCK_D,
        num_warps=4,
        num_stages=2,
    )
    return out


def flash_attention_memory_bytes(B: int, H: int, N: int, d: int,
                                  dtype: torch.dtype = torch.float16) -> int:
    """Approximate HBM traffic for flash attention (linear in N)."""
    elem_size = torch.finfo(dtype).bits // 8
    # We read Q, K, V once each and write O once.  No N×N matrix ever lands in HBM.
    return 4 * B * H * N * d * elem_size


# ---------------------------------------------------------------------------
# Numerical correctness check vs. naive
# ---------------------------------------------------------------------------

def verify_correctness(B=1, H=4, N=256, d=64, causal=True,
                       atol=1e-2, rtol=1e-2):
    """Compare flash_attention output to naive PyTorch reference."""
    from naive_attention import naive_attention

    torch.manual_seed(42)
    device = "cuda"
    q = torch.randn(B, H, N, d, dtype=torch.float16, device=device)
    k = torch.randn(B, H, N, d, dtype=torch.float16, device=device)
    v = torch.randn(B, H, N, d, dtype=torch.float16, device=device)

    ref  = naive_attention(q, k, v, causal=causal)
    fast = flash_attention(q, k, v, causal=causal)

    max_diff = (ref - fast).abs().max().item()
    ok = torch.allclose(ref.float(), fast.float(), atol=atol, rtol=rtol)
    print(f"Correctness check  causal={causal}  max_diff={max_diff:.4f}  {'PASS ✓' if ok else 'FAIL ✗'}")
    return ok


# ---------------------------------------------------------------------------
# Smoke-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if not torch.cuda.is_available():
        print("No CUDA device found — skipping Triton kernel smoke-test.")
    elif not HAS_TRITON:
        print("triton not installed — install with: pip install triton")
    else:
        import sys
        sys.path.insert(0, ".")
        ok = verify_correctness()
        if not ok:
            raise SystemExit(1)
        print("Flash attention kernel smoke-test passed.")
