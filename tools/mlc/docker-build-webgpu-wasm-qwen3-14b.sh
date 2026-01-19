#!/usr/bin/env bash
set -euo pipefail

# Docker (Linux/amd64) build for WebGPU wasm model library for WebLLM.
#
# Why Docker?
# - Avoid macOS/ARM toolchain issues (segfaults, missing deps)
# - Get a consistent emcc environment (emscripten/emsdk:3.1.56)
#
# Target:
# - https://huggingface.co/mlc-ai/Qwen3-14B-q4f16_1-MLC
#
# Output:
# - dist/webllm-model-libs/Qwen3-14B-q4f16_1-ctx40k_cs2k-webgpu.wasm
#
# Optional:
# - COPY_TO_PUBLIC=1: copy to Next.js static path:
#   public/webllm-model-libs/Qwen3-14B-q4f16_1-ctx40k_cs2k-webgpu.wasm
#
# Usage:
#   tools/mlc/docker-build-webgpu-wasm-qwen3-14b.sh
#   COPY_TO_PUBLIC=1 tools/mlc/docker-build-webgpu-wasm-qwen3-14b.sh
#

MODEL_REPO="mlc-ai/Qwen3-14B-q4f16_1-MLC"
MODEL_URL="https://huggingface.co/${MODEL_REPO}"

# We want ctx40k/cs2k to match app presets.
CTX=40960
CS=2048
MAX_BATCH=1

OUT_BASENAME="Qwen3-14B-q4f16_1-ctx40k_cs2k-webgpu.wasm"
DIST_DIR="dist"
META_DIR="${DIST_DIR}/mlc-model-metadata/${MODEL_REPO}"
CONFIG_PATH="${META_DIR}/mlc-chat-config.json"
OUT_DIR="${DIST_DIR}/webllm-model-libs"
OUT_PATH="${OUT_DIR}/${OUT_BASENAME}"

mkdir -p "${META_DIR}" "${OUT_DIR}"

echo "[host] Output: ${OUT_PATH}"

docker run --rm --platform=linux/amd64 \
  -e COPY_TO_PUBLIC="${COPY_TO_PUBLIC:-0}" \
  -e MODEL_REPO="${MODEL_REPO}" \
  -e MODEL_URL="${MODEL_URL}" \
  -e CONFIG_PATH="${CONFIG_PATH}" \
  -e OUT_PATH="${OUT_PATH}" \
  -e CTX="${CTX}" \
  -e CS="${CS}" \
  -e MAX_BATCH="${MAX_BATCH}" \
  -v "/Users/ridi25/Documents/GitHub/litomi:/work" \
  -w /work \
  emscripten/emsdk:3.1.56 \
  bash -lc '
set -euo pipefail

WORK_DIR="/work"
CONFIG_PATH_ABS="${CONFIG_PATH}"
OUT_PATH_ABS="${OUT_PATH}"
if [[ "${CONFIG_PATH_ABS}" != /* ]]; then
  CONFIG_PATH_ABS="${WORK_DIR}/${CONFIG_PATH_ABS}"
fi
if [[ "${OUT_PATH_ABS}" != /* ]]; then
  OUT_PATH_ABS="${WORK_DIR}/${OUT_PATH_ABS}"
fi

echo "[docker] Installing deps"
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  python3 \
  python3-pip \
  libx11-6

python3 -m pip install -U pip

# NOTE: We need both `mlc_llm` and `tvm` python modules available for compilation.
# Install from MLC wheel index (PyPI packages may not contain the actual modules).
# Some sub-deps (fastapi/shortuuid/tqdm) may be imported by the CLI.
python3 -m pip install --pre -U -f https://mlc.ai/wheels \
  mlc-ai-nightly-cpu \
  mlc-llm-nightly-cpu \
  shortuuid \
  fastapi \
  tqdm

python3 - <<'PY'
try:
  import mlc_llm  # noqa: F401
  import tvm  # noqa: F401
  print("[docker] OK: python modules ready (mlc_llm, tvm)")
except Exception as e:
  raise SystemExit(f"[docker] ERROR: python modules not ready: {e}")
PY

echo "[docker] Download mlc-chat-config.json"
mkdir -p "$(dirname "${CONFIG_PATH_ABS}")"
curl -fsSL "${MODEL_URL}/resolve/main/mlc-chat-config.json" -o "${CONFIG_PATH_ABS}"

echo "[docker] Force config overrides (ctx/cs/max_batch)"
python3 - "${CONFIG_PATH_ABS}" "${CTX}" "${CS}" "${MAX_BATCH}" <<'"'"'PY'"'"'
import json, sys

p = sys.argv[1]
ctx = int(sys.argv[2])
cs = int(sys.argv[3])
mb = int(sys.argv[4])

with open(p, "r", encoding="utf-8") as f:
  cfg = json.load(f)

cfg["context_window_size"] = ctx
cfg["prefill_chunk_size"] = cs
cfg["max_batch_size"] = mb

with open(p, "w", encoding="utf-8") as f:
  json.dump(cfg, f, ensure_ascii=False, indent=2)
  f.write("\n")

print("context_window_size:", cfg.get("context_window_size"))
print("prefill_chunk_size:", cfg.get("prefill_chunk_size"))
print("max_batch_size:", cfg.get("max_batch_size"))
PY

echo "[docker] Prepare wasm bitcode libs for TVM (clone mlc-llm source)"
rm -rf /tmp/mlc-llm
git clone --depth 1 https://github.com/mlc-ai/mlc-llm /tmp/mlc-llm

echo "[docker] Prepare wasm bitcode libs for TVM"
cd /tmp/mlc-llm

# Generates wasm runtime bitcode under TVM_SOURCE_DIR/web/dist/wasm/
./web/prep_emcc_deps.sh

TVM_SOURCE_DIR="/tmp/mlc-llm/3rdparty/tvm"
BC_DIR="${TVM_SOURCE_DIR}/web/dist/wasm"

if [[ ! -f "${BC_DIR}/wasm_runtime.bc" ]]; then
  echo "ERROR: wasm_runtime.bc not found at ${BC_DIR}" >&2
  ls -la "${BC_DIR}" || true
  exit 1
fi

echo "[docker] Copy wasm bitcode libs into installed tvm python package dir"
TVM_PY_DIR="$(python3 - <<'"'"'PY'"'"'
import tvm
from pathlib import Path
print(str(Path(tvm.__file__).parent))
PY
)"
cp -v "${BC_DIR}/wasm_runtime.bc" "${TVM_PY_DIR}/"
cp -v "${BC_DIR}/tvmjs_support.bc" "${TVM_PY_DIR}/" || true
cp -v "${BC_DIR}/webgpu_runtime.bc" "${TVM_PY_DIR}/" || true

echo "[docker] Patch mlc_llm for WebGPU correctness (best-effort)"
python3 - <<'"'"'PY'"'"'
from pathlib import Path

def patch_file(path: Path, patch_fn, label: str) -> None:
    before = path.read_text(encoding="utf-8")
    after = patch_fn(before)
    if after != before:
        path.write_text(after, encoding="utf-8")
        print(f"Patched ({label}): {path}")
    else:
        print(f"Skip patch ({label}, already applied or upstream changed): {path}")

import mlc_llm.compiler_pass.pipeline as pipeline_mod
pipeline_file = Path(pipeline_mod.__file__)

def patch_pipeline(text: str) -> str:
    needle = "tvm.relax.transform.StaticPlanBlockMemory()"
    if needle in text and "Disabled for WebGPU" not in text:
        text = text.replace(
            needle,
            "tvm.transform.Sequential([]),\n"
            "                # Disabled for WebGPU: avoid buffer aliasing that can violate WebGPU validation.",
        )
    return text

patch_file(pipeline_file, patch_pipeline, "mlc_llm.compiler_pass.pipeline")
PY

echo "[docker] Compile WebGPU wasm (can take a while)"
python3 -m mlc_llm compile "${CONFIG_PATH_ABS}" --device webgpu -o "${OUT_PATH_ABS}"

echo "[docker] OK: ${OUT_PATH_ABS}"

if [[ "${COPY_TO_PUBLIC:-0}" == "1" ]]; then
  PUBLIC_DIR="/work/public/webllm-model-libs"
  mkdir -p "${PUBLIC_DIR}"
  cp -v "${OUT_PATH_ABS}" "${PUBLIC_DIR}/"
  echo "[docker] Copied to: ${PUBLIC_DIR}/$(basename "${OUT_PATH}")"
fi
'


