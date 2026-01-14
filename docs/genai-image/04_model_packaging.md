## 모델 번들 규격(ONNX): 다운로드/Import/OPFS 저장

이 문서는 웹앱이 “모델”을 설치/로딩하기 위해 기대하는 **번들 포맷**을 정의합니다.  
전제: 런타임은 **`onnxruntime-web` + WebGPU**([docs](https://onnxruntime.ai/docs/build/web.html)).

### 1) 번들 단위

- 사용자가 설치/삭제/전환하는 단위는 **“모델 번들(Model Bundle)”** 입니다.
- 번들은 “온라인 다운로드” 또는 “로컬 Import”로 유입됩니다.

### 2) 권장 전달 형태

- **온라인 다운로드**: Hugging Face repo에 번들을 그대로 올리고, 앱이 파일들을 받아 설치
- **로컬 Import**: 사용자가 `.zip` 번들을 선택 → 앱이 풀어서 OPFS에 저장

> 참고: 서드파티 호스팅(Civitai 등)은 CORS/인증/URL 안정성 이슈로 앱에서 직접 다운로드가 실패할 수 있으므로, Import를 항상 제공합니다.

### 3) 디렉터리 레이아웃(권장)

```
bundle/
  manifest.json
  LICENSE.txt
  NOTICE.txt
  models/
    unet.onnx
    vae_decoder.onnx
    text_encoder.onnx
    tokenizer.json
    # SDXL 계열이면 text_encoder_2 등 추가될 수 있음
  assets/
    thumbnail.png
```

### 4) `manifest.json` 스키마(초안)

```json
{
  "id": "perfectdeliberate_xl",
  "name": "PerfectDeliberate XL (ONNX)",
  "version": "2026-01-01",
  "pipeline": "sdxl-t2i",
  "runtime": {
    "engine": "onnxruntime-web",
    "minVersion": ">=1.18.0"
  },
  "license": {
    "spdxLikeId": "FAIPL-1.0-SD",
    "homepage": "https://civitai.com/models/24350/perfectdeliberate"
  },
  "recommended": {
    "resolution": [1024, 1024],
    "steps": 30,
    "cfgScale": 6.5,
    "sampler": "euler_a",
    "previewEveryNSteps": 5
  },
  "files": [
    { "path": "models/unet.onnx", "sha256": "...", "size": 1234567890 },
    { "path": "models/vae_decoder.onnx", "sha256": "...", "size": 234567890 },
    { "path": "models/text_encoder.onnx", "sha256": "...", "size": 34567890 }
  ]
}
```

### 5) 무결성 검증

- 설치 시 `manifest.json.files[]`에 정의된 `sha256/size`를 기준으로 검증합니다.
- 검증 실패 시:
  - 온라인: 재시도/Import 유도
  - Import: “파일 손상/버전 불일치” 안내

### 6) OPFS 저장 규칙(권장)

- 저장 위치(예):
  - `opfs:/genai-models/{id}/{version}/...`
- 모델 전환 UX를 위해 다음 API를 제공:
  - `listInstalledModels()`
  - `getInstalledModel(id)`
  - `installFromUrl(manifestUrl)`
  - `installFromZip(file)`
  - `deleteModel(id, version?)`

### 7) “한 번에 한 모델 로드” 제약

- 앱은 동시에 1개 번들만 **로드 상태(ORT sessions 생성)**를 유지합니다.
- 전환 시 반드시:
  - 세션 dispose
  - GPU 메모리 해제(가능한 범위)

### 8) 모델 레지스트리(앱 내 기본 목록)

앱에는 “추천/기본 모델” 목록을 하드코딩하거나 원격 JSON으로 제공할 수 있습니다.

- 최소 메타:
  - `id`, `displayName`, `styleTag`(일러스트/반실사/실사)
  - `manifestUrl`
  - `licenseHomepage`
  - 권장 기본값(steps/CFG/샘플러)

### 9) 양자화/최적화(현실적인 가이드)

- 브라우저(WebGPU)에서의 실용성을 위해 보통 **FP16 기반 ONNX**가 출발점이 됩니다.
- “4bit/8bit” 같은 공격적 양자화는 런타임 지원/품질/성능 이득이 케이스 바이 케이스라서,
  - **MVP는 FP16**
  - 양자화는 별도 실험 트랙으로 분리(성능/품질 A/B)
