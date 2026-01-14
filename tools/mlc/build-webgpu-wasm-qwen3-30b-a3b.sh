#!/usr/bin/env bash
set -euo pipefail

# Build WebGPU wasm model library for WebLLM from MLC model repo.
#
# Target model (weights/config hosted on HuggingFace):
#   - https://huggingface.co/mlc-ai/Qwen3-30B-A3B-q4f16_1-MLC
#
# Output:
#   - dist/webllm-model-libs/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm
#
# Optional: copy the built wasm into Next.js public folder for local testing:
#   COPY_TO_PUBLIC=1 tools/mlc/build-webgpu-wasm-qwen3-30b-a3b.sh
#
# Prereqs (from official MLC LLM docs):
#   - Build mlc_llm from source (webgpu compile requires source build)
#   - Install emsdk/emcc (recommended emcc 3.1.56) and `source emsdk_env.sh`
#   - Prepare wasm runtime:
#       cd $MLC_LLM_SOURCE_DIR && ./web/prep_emcc_deps.sh
#     and ensure:
#       $TVM_SOURCE_DIR/web/dist/wasm/wasm_runtime.bc exists
#
# Ref:
#   - https://llm.mlc.ai/docs/compilation/compile_models.html
#   - https://llm.mlc.ai/docs/install/emcc.html#install-web-build

MODEL_REPO="mlc-ai/Qwen3-30B-A3B-q4f16_1-MLC"
MODEL_URL="https://huggingface.co/${MODEL_REPO}"

# NOTE: This naming matches the model's default mlc-chat-config.json today:
#   context_window_size=40960 (ctx40k), prefill_chunk_size=2048 (cs2k)
OUT_BASENAME="Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm"

DIST_DIR="dist"
META_DIR="${DIST_DIR}/mlc-model-metadata/${MODEL_REPO}"
CONFIG_PATH="${META_DIR}/mlc-chat-config.json"
OUT_DIR="${DIST_DIR}/webllm-model-libs"
OUT_PATH="${OUT_DIR}/${OUT_BASENAME}"

function die() {
  echo "ERROR: $*" >&2
  exit 1
}

function need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "필수 커맨드가 없어요: $1"
}

function need_env() {
  local k="$1"
  [[ -n "${!k:-}" ]] || die "환경변수가 필요해요: ${k}"
}

need_cmd curl
need_cmd python3
need_cmd emcc
need_env MLC_LLM_SOURCE_DIR
need_env TVM_SOURCE_DIR

MLC_LLM_CMD=()
if command -v mlc_llm >/dev/null 2>&1; then
  MLC_LLM_CMD=(mlc_llm)
else
  # Some installs only expose the CLI as a python module.
  MLC_LLM_CMD=(python3 -m mlc_llm)
fi

if [[ ! -d "${MLC_LLM_SOURCE_DIR}" ]]; then
  die "MLC_LLM_SOURCE_DIR 경로가 디렉터리가 아니에요: ${MLC_LLM_SOURCE_DIR}"
fi

if [[ ! -d "${TVM_SOURCE_DIR}" ]]; then
  die "TVM_SOURCE_DIR 경로가 디렉터리가 아니에요: ${TVM_SOURCE_DIR}"
fi

WASM_BC="${TVM_SOURCE_DIR}/web/dist/wasm/wasm_runtime.bc"
if [[ ! -f "${WASM_BC}" ]]; then
  cat >&2 <<'EOF'
ERROR: wasm_runtime.bc를 못 찾았어요.

WebGPU wasm 빌드 전에 아래를 먼저 해 주세요:
  1) emsdk 활성화 (emcc가 PATH에 있어야 해요)
  2) MLC LLM repo에서 wasm runtime 준비:
     cd "$MLC_LLM_SOURCE_DIR"
     ./web/prep_emcc_deps.sh

그리고 다음 파일이 존재하는지 확인해 주세요:
  $TVM_SOURCE_DIR/web/dist/wasm/wasm_runtime.bc
EOF
  exit 1
fi

echo "[0/3] Patch MLC LLM for WebGPU compatibility (MoE top-k / workgroup_size / buffer aliasing)"
python3 - <<'PY'
from pathlib import Path

import mlc_llm.compiler_pass.pipeline as pipeline_mod
import mlc_llm.op.moe_misc as moe_misc_mod

def patch_file(path: Path, patch_fn, label: str) -> None:
    before = path.read_text(encoding="utf-8")
    after = patch_fn(before)
    if after != before:
        path.write_text(after, encoding="utf-8")
        print(f"Patched ({label}): {path}")
    else:
        print(f"Skip patch ({label}, already applied or upstream changed): {path}")

pipeline_file = Path(pipeline_mod.__file__)

def patch_pipeline(text: str) -> str:
    # Disable StaticPlanBlockMemory on WebGPU to avoid buffer aliasing validation errors.
    needle = "tvm.relax.transform.StaticPlanBlockMemory()"
    if needle in text and "Disabled for WebGPU" not in text:
        text = text.replace(
            needle,
            "tvm.transform.Sequential([]),\n"
            "                # Disabled for WebGPU: avoid buffer aliasing that can violate WebGPU validation.",
        )
    # Keep the conservative Dlight fallback schedule (helps avoid rare segfaults).
    aggressive = (
        "\n                        dl.gpu.Matmul(),\n"
        "                        dl.gpu.GEMV(),\n"
        "                        dl.gpu.Reduction(),\n"
        "                        dl.gpu.GeneralReduction(),\n"
    )
    if aggressive in text:
        text = text.replace(
            aggressive,
            "\n"
            "                        # NOTE: WebGPU compile can hit rare TVM Dlight scheduling segfaults on some\n"
            "                        # models/hosts. Keep only the most conservative fallback schedule to\n"
            "                        # prioritize correctness over peak performance.\n",
        )
    return text

patch_file(pipeline_file, patch_pipeline, "mlc_llm.compiler_pass.pipeline")

moe_misc_file = Path(moe_misc_mod.__file__)

def patch_moe_misc(text: str) -> str:
    # Fix invalid WGSL generation: local_top_k_index[-1] out of bounds.
    text = text.replace("indices=[-1]", "indices=[t]")
    # Workgroup size: 1024 can exceed WebGPU maxComputeWorkgroupSizeX(256) on many devices.
    text = text.replace("TX = 1024", "TX = 256")
    return text

patch_file(moe_misc_file, patch_moe_misc, "mlc_llm.op.moe_misc")
PY

mkdir -p "${META_DIR}" "${OUT_DIR}"

echo "[1/3] Download mlc-chat-config.json"
curl -fsSL "${MODEL_URL}/resolve/main/mlc-chat-config.json" -o "${CONFIG_PATH}"

echo "[2/3] Sanity check config (context_window_size / prefill_chunk_size)"
python3 - "${CONFIG_PATH}" <<'PY'
import json, sys
p=sys.argv[1]
with open(p,"r",encoding="utf-8") as f:
  cfg=json.load(f)
ctx=cfg.get("context_window_size")
cs=cfg.get("prefill_chunk_size")
q=cfg.get("quantization")
mt=cfg.get("model_type")
print("model_type:", mt)
print("quantization:", q)
print("context_window_size:", ctx)
print("prefill_chunk_size:", cs)
if ctx != 40960:
  print("WARN: context_window_size가 예상(40960)과 달라요. 출력 파일명(CTX40k)과 맞는지 확인해 주세요.", file=sys.stderr)
if cs != 2048:
  print("WARN: prefill_chunk_size가 예상(2048)과 달라요. 출력 파일명(CS2k)과 맞는지 확인해 주세요.", file=sys.stderr)
PY

echo "[3/3] Compile WebGPU wasm (this can take a while)"
export MLC_LLM_SOURCE_DIR
export TVM_SOURCE_DIR
"${MLC_LLM_CMD[@]}" compile "${CONFIG_PATH}" --device webgpu -o "${OUT_PATH}"

echo "OK: ${OUT_PATH}"

if [[ "${COPY_TO_PUBLIC:-0}" == "1" ]]; then
  PUBLIC_DIR="public/webllm-model-libs"
  mkdir -p "${PUBLIC_DIR}"
  cp -v "${OUT_PATH}" "${PUBLIC_DIR}/"
  echo "Copied to: ${PUBLIC_DIR}/$(basename "${OUT_PATH}")"
fi


