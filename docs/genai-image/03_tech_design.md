## 기술 설계: 브라우저(WebGPU) 온디바이스 이미지 생성

### 1) 설계 원칙
- **런타임 선택(2안)**:
  - **A(표준)**: WebGPU + 표준 런타임 `onnxruntime-web`(ONNX 번들)
  - **B(고성능)**: TVM/MLC 계열의 **컴파일된 WebGPU 파이프라인**(사전 컴파일 아티팩트)
- **UI 스레드 보호**: 추론/디코딩은 WebWorker에서 수행
- **영속 캐시**: 모델 파일은 OPFS에 저장(재방문 시 네트워크 0)
- **장애 복구**: device lost/OOM에 대한 재시도/프리셋 다운 경로 제공
- **한 번에 한 모델**: GPU/메모리 안정성을 위해 세션은 1개만 유지

### 2) 아키텍처 개요

```mermaid
flowchart LR
  UI[UI Thread\n(React)] -->|postMessage| W[WebWorker\nInference]
  W --> ORT[onnxruntime-web\n(WebGPU execution provider)]
  W <--> OPFS[OPFS\n(모델 파일 저장)]
  W <-->|fetch| CDN[Hugging Face/Civitai 등\n(모델 번들)]
  W --> CANVAS[Preview/Result\n(Transfer to UI)]
  UI --> CANVAS
```

### 3) 모듈 분리(권장)
- **`webgpu/detect.ts`**
  - `navigator.gpu`/`requestAdapter()` 기반 지원 체크
  - `shader-f16` 지원 여부, limits 수집
- **`perf/bench.ts`**
  - 짧은 워밍업/벤치로 디바이스 등급 산정(예: fast/medium/slow)
  - 등급 기반 기본 프리셋(해상도, steps, 프리뷰 빈도) 결정
- **`models/registry.ts`**
  - 기본 모델 목록(이름/스타일/다운로드 URL/권장 파라미터/라이선스 메타)
- **`models/store-opfs.ts`**
  - OPFS에 모델 번들 저장/조회/삭제
  - 무결성 검증(sha256)
- **`models/downloader.ts`**
  - 다운로드 + 진행률 + 재시도
  - (MVP) 실패 시 재시도/에러 안내
  - (후순위) Import 지원 시 Import 유도
- **`inference/worker.ts`**
  - ORT 초기화, 세션 로드/해제, diffusion loop 실행
  - 중간 프리뷰 디코드 및 UI 전달

### 4) WebGPU 지원 확인(권장)
- 최소 체크:
  - `navigator.gpu` 존재
  - `await navigator.gpu.requestAdapter()` 성공
- 확장 체크:
  - `adapter.features.has("shader-f16")` 수집(성능 힌트)
  - `adapter.limits` 로깅(진단용)

### 5) 미니 벤치(워밍업) 설계
목표는 “정확한 성능 측정”이 아니라 **안전한 기본 프리셋 선택**입니다.

- 실행 시점: 최초 진입 1회(또는 모델 설치 후 1회)
- 방법(예시):
  - 작은 텐서 연산(ORT WebGPU로 1–3회 실행) 시간을 측정
  - 또는 짧은 diffusion “미니 run”(예: 4 steps, 512) 실행 시간을 측정
- 결과:
  - `tier=FAST|MEDIUM|SLOW`
  - `defaultResolution=1024 or 768`
  - `defaultStepsPreview`/`defaultStepsFinal`

### 6) 추론 파이프라인(개요)
- 모델 번들 로드(ONNX sessions 준비)
- text encoder → conditioning
- 초기 latent 샘플링
- diffusion loop:
  - step마다 UNet 실행
  - 일정 step마다 preview용 latent를 VAE decode(빈도 제한)
- 최종 VAE decode

### 6.1) (옵션) SDXL Refiner 파이프라인
Refiner는 품질을 올릴 수 있지만, **추가 용량/추가 시간**이 필요합니다.
- 권장 UX: Base 완료 시점에 1차 결과를 보여주고, Refiner를 “추가로” 실행(진행률/취소 유지)
- 권장 메모리 전략: Base UNet 세션을 dispose한 뒤 Refiner UNet 세션을 로드해 **동시 로드(2개) 없이 순차 실행**

### 7) 프리뷰(중간 결과) 전략
프리뷰는 UX에 큰 영향을 주므로, 비용을 제한하면서 체감 개선을 노립니다.
- 프리뷰 디코드는 **매 step이 아니라 N step마다**(예: 5/10/20/마지막)
- 프리뷰 해상도는 동일(1024) 또는 디코드 비용이 크면 768/512로 다운(옵션)
- 프리뷰 전송은 UI thread에 `ImageBitmap`/`Uint8ClampedArray` 등으로 전달

### 8) 오류 처리/복구
- **WebGPU device lost**
  - 세션 dispose → adapter/device 재생성 → 재시도 안내
- **OOM / out-of-memory**
  - 즉시 중단 + 옵션 제안:
    - 해상도 768로 낮추기
    - steps 감소
    - 프리뷰 빈도 감소
- **다운로드/검증 실패**
  - “Import로 불러오기” CTA 제공

### 9) 로컬 저장
- 결과 이미지는 서버 업로드 없이 `canvas.toBlob()`/`FileSaver` 등으로 다운로드 제공
- 파일명 규칙: `{modelId}_{timestamp}_{seed}.png` (예시)
- (옵션) “생성 결과 자동 저장(OPFS)”가 켜져 있으면 OPFS에도 저장


