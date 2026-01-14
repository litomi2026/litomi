## 브라우저(WebGPU) 온디바이스 이미지 생성 — 문서 인덱스

이 폴더는 **브라우저(WebGPU)에서 온디바이스로 이미지 생성형 AI를 실행**하는 기능의 기획/설계 문서 모음입니다.

### 한 줄 요약

- **클라우드 GPU 없이** 사용자의 **Chrome/Edge(WebGPU)** 에서 Stable Diffusion 계열 모델을 실행해 이미지를 생성합니다.
- 모델은 **Hugging Face 등 공개 호스팅**에서 다운로드하거나, 사용자가 **로컬 파일 Import**로 가져옵니다.
- 다운로드한 모델은 **OPFS(Origin Private File System)** 에 영속 저장하고, **한 번에 1개 모델만 메모리에 로드**합니다.
- 생성 중 **중간 프리뷰**(일정 step마다 디코드)로 대기 UX를 개선합니다.

### 전제(합의된 요구사항)

- **지원 OS/브라우저**: Windows 노트북 / macOS, **Chrome/Edge(Chromium)만 공식 지원**, WebGPU 지원 환경만.
- **모바일 미지원**
- **목표 품질**: 기본 1024, 성능 부족 시 768로 자동/수동 다운 가능
- **허용 지연**: 2분 초과 허용(단, 프리뷰/취소 제공)
- **서버 비용 최소화**: 클라우드 GPU 없음(0), 이미지 서버 저장 없음(로컬 저장)
- **콘텐츠 필터링 없음**(NSFW/유해 프롬프트 필터링 미구현)
- **모델/LoRA 유출 허용**

### 문서 구성(권장 세트: 6개 + 인덱스)

- `01_prd.md`: 제품 기획(PRD)
- `02_ux_flow.md`: UX/화면 흐름 및 상태 정의
- `03_tech_design.md`: 기술 설계(런타임/아키텍처/성능 전략)
- `04_model_packaging.md`: 모델 번들(ONNX) 포맷/manifest/다운로드·Import 규격
- `05_licensing_compliance.md`: FAIPL 1.0‑SD 기반 라이선스/Notices 대응(배포 시 포함물)
- `06_metrics_rollout.md`: 지표/로그/롤아웃/QA

### 범위 밖(이 문서 세트에서는 다루지 않음)

- 학습/파인튜닝 파이프라인(LoRA training 등)
- 서버 기반 생성/하이브리드 fallback
- 모바일 최적화
