"""
naive_attention.py — Simulated (baseline) scaled dot-product attention.

This is the textbook O(N²) memory implementation:
    Attention(Q, K, V) = softmax(QKᵀ / √d_k) · V

The full N×N attention matrix is materialised in HBM (GPU DRAM).
For a sequence of length N = 4096 with d = 64, that is:
    4096 × 4096 × 4 bytes = 64 MB *per head* — the dominant memory cost.
"""

import math
import torch
import torch.nn.functional as F


# ---------------------------------------------------------------------------
# Reference: pure-Python / PyTorch (no custom kernel)
# ---------------------------------------------------------------------------

def naive_attention(q: torch.Tensor, k: torch.Tensor, v: torch.Tensor,
                    causal: bool = False) -> torch.Tensor:
    """
    Args:
        q: (B, H, N, d)   — query
        k: (B, H, N, d)   — key
        v: (B, H, N, d)   — value
        causal: mask future tokens (autoregressive)
    Returns:
        out: (B, H, N, d)
    """
    B, H, N, d = q.shape
    scale = 1.0 / math.sqrt(d)

    # Step 1 — QKᵀ                         shape: (B, H, N, N)
    scores = torch.matmul(q, k.transpose(-2, -1)) * scale

    # Step 2 — causal mask (upper triangle → -inf)
    if causal:
        mask = torch.triu(torch.ones(N, N, device=q.device, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(mask, float("-inf"))

    # Step 3 — softmax over key dimension
    attn = F.softmax(scores, dim=-1)          # materialises full N×N in HBM

    # Step 4 — weighted sum of values
    out = torch.matmul(attn, v)               # (B, H, N, d)
    return out


def naive_attention_memory_bytes(B: int, H: int, N: int, d: int,
                                  dtype: torch.dtype = torch.float16) -> int:
    """Approximate HBM traffic for naive attention (dominant: the N×N matrix)."""
    elem_size = torch.finfo(dtype).bits // 8
    qkv_bytes  = 3 * B * H * N * d * elem_size
    score_bytes = B * H * N * N * elem_size   # <-- quadratic term
    out_bytes   = B * H * N * d * elem_size
    return qkv_bytes + score_bytes + out_bytes


# ---------------------------------------------------------------------------
# Smoke-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    torch.manual_seed(0)
    B, H, N, d = 1, 4, 256, 64
    dtype = torch.float16
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Running naive attention on {device}")

    q = torch.randn(B, H, N, d, dtype=dtype, device=device)
    k = torch.randn(B, H, N, d, dtype=dtype, device=device)
    v = torch.randn(B, H, N, d, dtype=dtype, device=device)

    out = naive_attention(q, k, v, causal=True)
    print(f"  output shape : {out.shape}")
    print(f"  output norm  : {out.float().norm():.4f}")
    mem = naive_attention_memory_bytes(B, H, N, d, dtype)
    print(f"  HBM estimate : {mem / 1e6:.2f} MB  (N={N})")
