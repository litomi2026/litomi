# MLC(WebGPU) model lib 빌드

목표: **브라우저(WebGPU)에서 WebLLM이 로드하는 `model_lib`(WASM)** 를 로컬에서 직접 빌드해요.

이 repo는 `@mlc-ai/web-llm`(WebLLM)을 사용하고 있고, WebGPU에서 모델을 돌리려면:

- **MLC 포맷 가중치 repo (HuggingFace)** +
- **WebGPU용 model lib (`*.wasm`)**

두 개가 필요해요.

## Qwen3-30B-A3B(q4f16_1) WebGPU WASM 빌드

원격 wasm(권장):

- 로컬에서 wasm을 빌드하지 않고, HuggingFace에 올린 `*.wasm`을 그대로 써도 돼요.
- 이때 `modelLibUrl`에는 **반드시 `resolve/main/...` 다운로드 링크**를 넣어야 해요. (`blob/...`은 파일 보기 페이지예요)

스크립트:

- `tools/mlc/build-webgpu-wasm-qwen3-30b-a3b.sh`

로컬 호스팅(선택):

- 빌드 산출물을 `public/webllm-model-libs/`로 복사하면, `Next.js dev`에서 바로 `model_lib` URL로 쓸 수 있어요.
- 이 repo의 기본 30B 프리셋은 아래 경로를 기본으로 봐요:
  - `/webllm-model-libs/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm`

자세한 사용법은 스크립트 상단 주석을 확인해 주세요.
