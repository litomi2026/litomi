#!/usr/bin/env python3
"""
Export BAAI/bge-m3 to ONNX for dense embeddings.

Output requirements (per LOCAL_SEMANTIC_SEARCH_SPEC.md):
- bge-m3.onnx must output last_hidden_state: [batch, seq, hidden]
- pooling/normalize is done in app code (CLS pooling + L2 normalize)
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--model-id", default="BAAI/bge-m3")
    p.add_argument("--out-dir", default="data/model")
    p.add_argument("--opset", type=int, default=17)
    p.add_argument("--max-length", type=int, default=32)
    p.add_argument("--verify", action="store_true")
    p.add_argument("--device", choices=["cpu"], default="cpu")
    return p.parse_args()


def save_tokenizer_json(tokenizer, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    tokenizer_json = out_dir / "tokenizer.json"

    # Prefer a single tokenizer.json file (fast tokenizer).
    backend = getattr(tokenizer, "backend_tokenizer", None)
    if backend is not None and hasattr(backend, "save"):
        backend.save(str(tokenizer_json))
        return

    # Fallback: transformers save_pretrained (may create multiple files).
    tokenizer.save_pretrained(str(out_dir))
    if tokenizer_json.exists():
        return

    raise RuntimeError(
        "tokenizer.json was not generated. Please ensure you are using a fast tokenizer."
    )


def main() -> None:
    args = parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Lazy imports so the script can show a clean error if deps are missing.
    import numpy as np
    import torch
    from transformers import AutoModel, AutoTokenizer

    print(f"[export] model={args.model_id}")
    print(f"[export] out_dir={out_dir}")

    tokenizer = AutoTokenizer.from_pretrained(args.model_id, use_fast=True)
    save_tokenizer_json(tokenizer, out_dir)

    model = AutoModel.from_pretrained(args.model_id)
    model.eval()

    class DenseOnly(torch.nn.Module):
        def __init__(self, inner):
            super().__init__()
            self.inner = inner

        def forward(self, input_ids, attention_mask, token_type_ids):
            out = self.inner(
                input_ids=input_ids,
                attention_mask=attention_mask,
                token_type_ids=token_type_ids,
                return_dict=True,
            )
            return out.last_hidden_state

    dense_model = DenseOnly(model)

    text = "프리렌과 페른이 하렘에 갇히고 슈타르크가 구하러 간다"
    encoded = tokenizer(
        text,
        max_length=args.max_length,
        truncation=True,
        padding="max_length",
        return_tensors="pt",
    )

    input_ids = encoded["input_ids"]
    attention_mask = encoded["attention_mask"]
    token_type_ids = encoded.get("token_type_ids")
    if token_type_ids is None:
        token_type_ids = torch.zeros_like(input_ids)

    onnx_path = out_dir / "bge-m3.onnx"

    dynamic_axes = {
        "input_ids": {0: "batch", 1: "seq"},
        "attention_mask": {0: "batch", 1: "seq"},
        "token_type_ids": {0: "batch", 1: "seq"},
        "last_hidden_state": {0: "batch", 1: "seq"},
    }

    print(f"[export] writing {onnx_path}")
    torch.onnx.export(
        dense_model,
        (input_ids, attention_mask, token_type_ids),
        str(onnx_path),
        input_names=["input_ids", "attention_mask", "token_type_ids"],
        output_names=["last_hidden_state"],
        dynamic_axes=dynamic_axes,
        opset_version=args.opset,
        do_constant_folding=True,
    )

    print("[export] done")

    if not args.verify:
        return

    try:
        import onnxruntime as ort
    except Exception as e:
        raise RuntimeError(
            "onnxruntime is required for --verify. Install it in your Python env."
        ) from e

    with torch.no_grad():
        pt_last = dense_model(input_ids, attention_mask, token_type_ids)
        pt_cls = pt_last[:, 0, :].cpu().numpy()

    sess = ort.InferenceSession(
        str(onnx_path),
        providers=["CPUExecutionProvider"],
    )
    onnx_last = sess.run(
        ["last_hidden_state"],
        {
            "input_ids": input_ids.cpu().numpy().astype(np.int64),
            "attention_mask": attention_mask.cpu().numpy().astype(np.int64),
            "token_type_ids": token_type_ids.cpu().numpy().astype(np.int64),
        },
    )[0]
    onnx_cls = onnx_last[:, 0, :]

    max_abs = float(np.max(np.abs(pt_cls - onnx_cls)))
    print(f"[verify] max_abs_error(cls)={max_abs:.6g}")


if __name__ == "__main__":
    # Avoid HF parallelism warning noise
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    main()

