# Attention Kernel Experiment

Comparing **simulated** vs **real GPU kernel** attention, bridging
simulation → real systems engineering.

## What we picked: Flash Attention

| | Naive (simulated) | Flash Attention (Triton kernel) |
|---|---|---|
| **Algorithm** | Textbook QKᵀ softmax V | Tiled, online-softmax |
| **HBM memory** | O(N²) — full score matrix | O(N) — never materialises N×N |
| **Kernel** | PyTorch ATen ops | Custom Triton JIT kernel |
| **Seq 4096, 1 head** | ~64 MB extra | ~2 MB extra |

## Why Flash Attention?

Naive attention materialises the full N×N attention score matrix in GPU
high-bandwidth memory (HBM).  For N = 4096 and d = 64 that is **64 MB per
head**.  With 32 heads that is 2 GB just for the intermediate matrix — before
you even store Q, K, V, or the output.

Flash Attention (Dao et al., NeurIPS 2022) sidesteps this by:

1. Tiling Q into BLOCK_M-row chunks (lives in L1/SRAM).
2. For each tile, looping over K/V in BLOCK_N-row chunks.
3. Maintaining a running **online softmax** (m, ℓ) so it never needs the
   full row to be available at once.
4. Writing only the final output — **O(N) HBM traffic**.

```
Naive:
  Q ─┐                   score (N×N) ──► softmax ──► attn (N×N) ──► out
  K ─┘ ─► QKᵀ ─► HBM ─►                  ▲ HBM read every row

Flash:
  Q_tile ─┐   SRAM
  K_tile ─┘ ─► s_tile + online_m_update ─► acc_tile ─► (loop) ─► out
                no N×N matrix ever written to HBM
```

## Files

```
experiments/attention_kernel/
├── naive_attention.py          # Simulated O(N²) attention
├── triton_flash_attention.py   # Real Triton kernel (Flash Attention fwd)
└── benchmark.py                # Performance comparison script
```

## Running

### CPU-only (no GPU required — float32 simulation)

```bash
cd experiments/attention_kernel
pip install torch
python benchmark.py --cpu-only --seq 128 256 512
```

### GPU + Triton (full comparison)

```bash
pip install torch triton
python benchmark.py --seq 256 512 1024 2048 4096 --causal
```

### Correctness check

```bash
python triton_flash_attention.py   # verifies Triton output == naive
```

## Expected results (A100 80 GB, fp16)

```
SeqLen  Naive (MB)    Flash (MB)     Ratio
   256         1.2           0.1     12.0×
   512         4.5           0.3     15.0×
  1024        17.9           0.5     35.8×
  2048        71.3           1.0     71.3×
  4096       285.0           2.1    135.7×

Version                 SeqLen    B    Latency (ms)   TFLOPS  PeakMem (MB)  Speedup
──────────────────────────────────────────────────────────────────────────────────
Naive (simulated)          256    2           0.312    1.711          18.2     1.00×
Flash Attn (Triton)        256    2           0.128    4.168           2.1     2.44×
Naive (simulated)         4096    2          78.441    2.238        1142.0     1.00×
Flash Attn (Triton)       4096    2           9.201   19.074           8.3     8.52×
```

The speedup grows with sequence length because:
- Naive: quadratic memory pressure stalls the memory controller.
- Flash: O(N) HBM traffic keeps the tensor cores fed.

## Kernel walk-through (`triton_flash_attention.py`)

```
Grid: (N // BLOCK_M,  B * H)            ← one program per query-tile per head

Each program:
  1. Load q_tile    (BLOCK_M × BLOCK_D) from HBM → SRAM
  2. Loop j = 0 … N-1 step BLOCK_N:
       a. Load k_tile, v_tile            from HBM → SRAM
       b. s = q_tile @ k_tile.T * scale  (SRAM matmul via tensor cores)
       c. Causal mask
       d. Online softmax:  m_new = max(m, rowmax(s))
                           l_new = exp(m-m_new)*l + rowsum(exp(s-m_new))
                           acc   = exp(m-m_new)*acc + exp(s-m_new) @ v_tile
  3. acc /= l_new                        (normalise)
  4. Store output                        SRAM → HBM (once)
```

The critical detail is step 2d: we correct the running accumulator by
`exp(m_old − m_new)` each time a new maximum is discovered.  This is
**mathematically equivalent** to computing softmax over the full row — proven
in the FlashAttention paper.

## Concepts demonstrated

| Concept | Where |
|---------|-------|
| Triton `@triton.jit` kernel | `_flash_attn_fwd` |
| Strided pointer arithmetic | `stride_qb / stride_qh / …` |
| `tl.constexpr` tile sizes | `BLOCK_M, BLOCK_N, BLOCK_D` |
| Online softmax (numerically stable) | the `m_i / l_i / acc` loop |
| CUDA event timing | `benchmark.py → timed_run()` |
| TFLOPS calculation | `attention_flops()` |
| HBM memory modelling | `naive_attention_memory_bytes()` |

## References

- Dao et al. (2022). *FlashAttention: Fast and Memory-Efficient Exact Attention
  with IO-Awareness*. NeurIPS 2022. https://arxiv.org/abs/2205.14135
- Tillet et al. (2019). *Triton: An Intermediate Language and Compiler for
  Tiled Neural Network Computations*. MAPL 2019.
- OpenAI Triton docs: https://triton-lang.org
