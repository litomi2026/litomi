## 지표/롤아웃/QA: 브라우저(WebGPU) 온디바이스 이미지 생성

### 1) 관측 원칙
- 서버가 이미지를 처리하지 않으므로, 관측은 **클라이언트(브라우저) 중심**입니다.
- 프롬프트/이미지 내용은 수집하지 않는 것을 기본으로 하고, 필요 시 **최소한의 익명 성능/에러 지표**만 수집합니다.

### 2) 핵심 지표(추천)

#### 2.1 환경/호환성
- WebGPU 지원율: `webgpu_supported / total_visits`
- `shader-f16` 지원율
- OS/브라우저 버전 분포(최소한)

#### 2.2 모델 설치
- 설치 시작/성공/실패율
- 평균 다운로드 시간 / 평균 설치 시간
- 설치 실패 이유 분포(네트워크, CORS, 검증 실패, 저장공간 부족 등)

#### 2.3 생성(추론)
- 생성 성공/실패/취소 비율
- 첫 프리뷰까지 시간(TTFP: time to first preview)
- 전체 생성 시간(완료까지)
- OOM 발생률, device lost 발생률
- 자동 프리셋 다운(1024→768) 발생률

### 3) 로그 설계(권장 이벤트)
- `genai.webgpu.unsupported`
- `genai.bench.completed` (tier만)
- `genai.model.install.started|succeeded|failed`
- `genai.model.load.started|succeeded|failed`
- `genai.generate.started|preview|succeeded|failed|cancelled`

> 프롬프트 텍스트/생성 이미지는 원칙적으로 로그에 넣지 않습니다.

### 4) QA/테스트 계획(현실적인 체크리스트)

#### 4.1 기능
- WebGPU 미지원 환경에서 차단/안내 정상 동작
- 모델 다운로드/Import/삭제/전환 동작
- 생성 시작/취소/재시도
- 로컬 저장(PNG)

#### 4.2 성능/안정성(대표 기기)
- Windows(내장 GPU) / Windows(dGPU) / macOS(Apple Silicon)
- 1024/768 각각:
  - 첫 프리뷰 시간
  - 최종 완료 시간
  - 메모리 폭주/브라우저 탭 크래시 여부

#### 4.3 실패 주도 테스트
- 네트워크 끊김 중 다운로드
- 저장공간 부족/영속 저장 거부
- device lost 유도(드라이버/탭 백그라운드 등) 후 복구

### 5) 롤아웃 전략(권장)
- 0단계: 로컬/개발자 빌드에서만 노출
- 1단계: 내부 사용자(도그푸딩) + 로그/지표 수집
- 2단계: 일부 트래픽(또는 기능 플래그)로 공개
- 3단계: 공식 기능 전환

### 6) 런타임 버전 관리(권장)
- `onnxruntime-web` 버전 고정(회귀 방지)
- 모델 번들 `manifest.version`을 통해 “호환 런타임 최소 버전” 명시


