# litomi

만화 웹 뷰어예요. 안전하고 쾌적한 감상 경험을 목표로 해요.  
코드는 항상 공개해서 오픈 소스로 운영하려고 해요.

English README: [`README.en.md`](README.en.md)

## 미리보기

![검색 화면](public/image/search.webp)
![북마크 화면](public/image/bookmark.webp)

## 기능

- **감상(뷰어)**
  - 터치보기, 스크롤보기
  - 한 쪽 보기, 두 쪽 보기
  - 상하 넘기기, 좌우 넘기기
  - 상하 스와이프로 밝기 조절
  - 좌우 스와이프로 페이지 넘기기
  - 이미지 레이아웃 조정
  - 자동 넘기기
  - 마지막 감상 페이지부터 이어서 보기
  - 미리보기(썸네일)
  - 터치보기: 스크롤로 페이지 넘기기
  - 터치보기: meta + 스크롤로 이미지 확대
  - 스크롤보기: 이미지 너비 조절
- **검색/탐색**
  - 카드 보기, 이미지(그림) 보기
  - 고급 필터(조회수/페이지/별점/기간 등 범위 조건)
  - 정렬(인기순/오래된 순/랜덤)
  - 인기 검색어
  - 최근 검색어
  - 신작
  - 랜덤(20초마다 자동 갱신)
  - 이 작품과 함께 좋아한 작품 추천(별점 기반)
  - 태그 탐색(카테고리별) + 태그 한글 번역
- **서재/기록**
  - 북마크
  - 북마크 백업: 다운로드/업로드(JSON)
  - 감상 기록
  - 작품 평가(별점) + 평가 목록
  - 서재: 북마크 폴더별 정리
  - 서재 일괄 작업: 복사/이동/제거
  - 데이터 내보내기(비밀번호 확인): 북마크/기록/별점/서재/검열 설정
- **검열**
  - 키워드로 작품 검열
  - 규칙 가져오기/내보내기(JSON/CSV)
- **알림**
  - 알림 센터: 읽음 처리/삭제/필터링(미확인/신규 작품 등)
  - 키워드 알림
  - 웹 푸시 알림
- **인기/랭킹**
  - 조회수/북마크 등의 기간별 인기 순위
  - 실시간 인기 페이지 순위 (Google Analytics Data API)
- **이야기(포스트)**
  - 추천 타임라인
  - 글/이미지 포스트
  - 좋아요/리포스트/댓글/조회수
- **계정/보안**
  - 회원가입, 로그인
  - 성인 인증(BBaton)
  - 패스키 로그인(WebAuthn)
  - 2단계 인증(TOTP)
- **안전**
  - 작품 신고
- **리보(포인트)**
  - 적립/상점/내역
- **앱 설치**
  - PWA 설치(홈 화면에 추가)
  - Android APK 설치 안내

## 기술 스택

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Drizzle ORM
- TanStack Query
- Hono (Backend)

## 로컬 개발 (Quickstart)

로컬 개발은 **Postgres + Redis(docker compose) + Backend + Web**을 모두 띄우는 구성이에요.

### 준비물

- Bun (권장: `package.json`의 `devDependencies.bun` 버전 근처)
- Docker + Docker Compose

### 1) 의존성 설치

```bash
bun install
```

### 2) Postgres/Redis 실행 (docker compose)

```bash
docker compose up -d
```

기본 포트:

- Web: `3000`
- Backend: `8080`
- Postgres: `5434`
- Serverless Redis HTTP: `8079`

> 참고: `bun run db:up`은 `docker compose down -v`를 포함해서 **DB 볼륨이 초기화돼요**. 처음부터 다시 시작할 때만 사용해 주세요.

### 3) 환경 변수 설정 (`.env.development`)

아래는 로컬 개발용 예시예요(필요에 따라 바꿔 주세요):

```bash
# --- Web (Next.js) ---
NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
NEXT_PUBLIC_CANONICAL_URL="http://localhost:3000"

# Cloudflare Turnstile (원하면 실제 키로 교체해 주세요)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="dev-site-key"
TURNSTILE_SECRET_KEY="dev-secret-key"

# Web Push (원하면 실제 키로 교체해 주세요)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="dev-vapid-public-key"
VAPID_PRIVATE_KEY="dev-vapid-private-key"

# --- Backend (Hono) ---
CORS_ORIGIN="http://localhost:3000"

# Third-party (로컬에선 더미 값으로도 시작할 수 있어요)
ADSTERRA_API_KEY="dev"
BBATON_CLIENT_ID="dev"
BBATON_CLIENT_SECRET="dev"

# --- Database (Postgres) ---
POSTGRES_URL="postgresql://test_user:test_password@localhost:5434/test_db"
POSTGRES_URL_DIRECT="postgresql://test_user:test_password@localhost:5434/test_db"

# Aiven DB도 로컬에선 동일 DB를 써도 돼요
AIVEN_POSTGRES_URL="postgresql://test_user:test_password@localhost:5434/test_db"

# --- Redis (Serverless Redis HTTP; docker compose로 같이 떠요) ---
UPSTASH_KV_REST_API_URL="http://localhost:8079"
UPSTASH_KV_REST_API_TOKEN="local_dev_token"

# --- Auth / Security (로컬용 비밀키) ---
JWT_SECRET_ACCESS_TOKEN="dev-access"
JWT_SECRET_REFRESH_TOKEN="dev-refresh"
JWT_SECRET_TRUSTED_DEVICE="dev-trusted-device"
JWT_SECRET_BBATON_ATTEMPT="dev-bbaton-attempt"

# 64자 hex 문자열이 필요해요
# bun run tools/generateEncryptionKey.ts
TOTP_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### 4) DB 스키마 반영 (Drizzle)

```bash
# Supabase 스키마
bun run db:push

# Aiven 스키마
bun run db:push:aiven
```

### 5) Backend 실행

```bash
bun run dev:backend
```

### 6) Web 실행

```bash
bun dev
```

## 테스트

- 문서: [`docs/testing.md`](docs/testing.md)
- 대표 커맨드:
  - `bun test`
  - `bun run test:e2e`

## 모바일

- 문서: [`docs/mobile-distribution.md`](docs/mobile-distribution.md)

## 배포

- **Vercel (Web)**: Next.js 앱 배포에 사용해요.
- **Cloud Run (Job)**: 주기 작업(데이터 동기화/알림)을 배포할 때 사용해요.
  - [`cloud-run/manga-crawl/README.md`](cloud-run/manga-crawl/README.md)
  - [`cloud-run/crawl-and-notify/README.md`](cloud-run/crawl-and-notify/README.md)

### 1) Ubuntu 서버에서 Coolify 설치

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

설치 후 Coolify UI는 기본적으로 `http://<server-ip>:8000`에서 열려요.

### 2) Ubuntu 서버에서 cloudflared 실행

```bash
sudo docker rm -f cloudflared 2>/dev/null || true; \
sudo docker run -d \
  --name cloudflared \
  --restart unless-stopped \
  --network host \
  cloudflare/cloudflared:2026.1.2 \
  tunnel run --token "eyJhI..."
```

Cloudflare Tunnel token을 입력하세요..

## 기여하기

기여는 언제든 환영해요.

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SECURITY.md`](SECURITY.md)
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## License

GPL-3.0. 자세한 내용은 [`LICENSE`](LICENSE)를 확인해 주세요.
