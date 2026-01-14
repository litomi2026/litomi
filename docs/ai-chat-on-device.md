# 온디바이스 캐릭터 AI 채팅 (WebGPU + WebLLM)

리토미의 캐릭터 AI 채팅은 **서버에서 추론하지 않고**, 사용자의 **브라우저(WebGPU)**에서 LLM을 실행해요.

- **모델 다운로드/설치**: 브라우저가 WebLLM 기본 호스팅(MLC 공개 배포)에서 모델 아티팩트를 내려받아 캐시해요.
- **추론**: `@mlc-ai/web-llm`(WebLLM/MLC)을 사용해서 WebGPU로 실행해요.
- **로그 저장**: 추론 결과(유저/어시스턴트 원문)는 로그인된 사용자 계정으로 **백엔드 DB에 저장**돼요.
- **오프라인**: 오프라인이어도 로컬 추론은 계속 가능하고, 로그는 IndexedDB outbox에 쌓았다가 온라인 되면 전송해요.
- **동시성**: 안정성을 위해 **한 탭에서만** 모델을 실행해요.

## 지원 환경

- **필수**: WebGPU 지원 브라우저 + GPU
- **iOS**: **iOS 18 / Safari 18 이상**을 기준으로 안내해요(보수적으로 최신만).
  - iOS Safari에서는 WebGPU가 꺼져 있을 수 있어요.
  - 설정 앱에서 `설정 > Safari > 고급 > 실험적 기능`에서 **WebGPU**를 켜고 다시 시도해 주세요.

## 모델

기본적으로는 **WebLLM 내장(prebuilt) 모델**을 쓰고, 필요하면 **커스텀 모델 프리셋**(예: Qwen3)을 추가해서 써요.

브라우저에서 bf16 “원본” 그대로를 쓰는 건 메모리/지원 문제가 커서, **모델은 동일하지만 웹 배포용으로 q4f16로 변환**하는 게 일반적이에요.

## 아티팩트 빌드(MLC/WebLLM 파이프라인)

WebLLM은 MLC LLM 아티팩트를 그대로 사용해요. 자세한 빌드 방법은 MLC LLM 문서를 기준으로 진행하는 게 안전해요.

- 참고: `https://github.com/mlc-ai/mlc-llm/`
- 참고(설정 파일): `mlc-chat-config.json`의 `context_window_size`가 **16384(16k)**로 맞아야 해요.

실무에선 보통 아래 결과물이 나오면 성공이에요:

- **모델 디렉터리**(가중치 shard + `mlc-chat-config.json` + tokenizer 파일들)
- **WASM 모델 라이브러리**(webgpu, ctx16k로 빌드된 `.wasm`)

## (고급) Qwen3-30B-A3B(q4f16_1) WebGPU wasm 직접 빌드하기

`mlc-ai/Qwen3-30B-A3B-q4f16_1-MLC`는 **MLC 포맷 가중치(=params_shard) + `mlc-chat-config.json`** 까지는 제공하지만,
WebLLM이 바로 쓸 수 있는 **WebGPU용 `model_lib`(`*.wasm`)** 는 직접 만들어야 할 수 있어요.

다만 지금은 이 repo에서 쓰는 Qwen3 프리셋 기준으로, **HuggingFace에 올린 원격 `*.wasm`을 그대로 쓰는 방식(권장)**도 지원해요. 이 경우 로컬 빌드는 선택이에요.

이 repo에는 아래 스크립트를 추가해뒀어요:

- `tools/mlc/build-webgpu-wasm-qwen3-30b-a3b.sh`

### 요약 흐름

- **1) `mlc_llm`을 소스에서 빌드**해요(WebGPU 컴파일은 소스 빌드가 필요해요).
- **2) emsdk(emcc) 설치 + wasm runtime 준비**(`./web/prep_emcc_deps.sh`)를 해요.
- **3) `mlc_llm compile --device webgpu`로 `*.wasm`을 뽑아요.**

### 로컬에서 바로 써보기

스크립트에 `COPY_TO_PUBLIC=1`을 주면 빌드 산출물을 `public/webllm-model-libs/`로 복사해요.
그럼 `Next.js dev`에서 `/webllm-model-libs/<file>.wasm` URL로 접근 가능해요.

- 폴더: `public/webllm-model-libs/` (바이너리는 git에 커밋하지 않아요)
- 로컬 URL 예: `http://localhost:3000/webllm-model-libs/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm`

자세한 준비물/환경변수는 스크립트 상단 주석을 확인해 주세요.

### 원격 wasm으로 쓰기(권장)

- `modelLibUrl`에는 HuggingFace **다운로드 링크(`resolve/main/...`)**를 넣어야 해요.
  - `blob/main/...`은 파일 보기 페이지라서 그대로 쓰면 로드가 실패해요.
- 예: `https://huggingface.co/gwak2837/webllm-model-libs/resolve/main/Qwen3-30B-A3B-q4f16_1-ctx40k_cs2k-webgpu.wasm`

## 모델 아티팩트 호스팅(기본: WebLLM 내장)

`chat.webllm.ai`처럼, **WebLLM 내장 `prebuiltAppConfig`**를 사용하면 모델 파일은 기본적으로
HuggingFace(mlc-ai) + GitHub raw(binary-mlc-llm-libs)에서 다운로드돼요.

클라이언트 코드는 `src/app/(navigation)/chat/lib/webllm.ts`에서 모델 프리셋을 관리해요.

필요하면 나중에만 “자체 호스팅(R2)”으로 바꿀 수 있어요(현재는 R2 없이 동작하도록 구성했어요).

## 백엔드 로그 API

- `POST /api/v1/character-chat/sessions`
  - `clientSessionId` 기반으로 **idempotent**하게 세션을 만들거나(이미 있으면) 기존 세션 id를 돌려줘요.
- `POST /api/v1/character-chat/sessions/:sessionId/messages`
  - `clientMessageId` 기반으로 **중복 저장을 방지**해요(오프라인 재시도 대비).

## 오프라인 outbox 정책

- **401**: 로그인 후 재개(일시 중단)
- **429**: 예외적으로 재시도(백오프)
- **기타 4xx**: 실패 처리(재시도하지 않음)
- **5xx/네트워크 오류**: 무한 재시도(지수 백오프 + jitter)
