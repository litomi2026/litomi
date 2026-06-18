# litomi

리토미는 히토미 미러 만화 웹 뷰어예요. 안전하고 쾌적한 감상 경험을 목표로 하고 코드는 공개해서 오픈 소스로 운영하려고 해요.

English README: [`README.en.md`](README.en.md)

## Preview

![검색 화면](apps/web/public/image/desktop-search.avif)
![북마크 화면](apps/web/public/image/desktop-bookmark.avif)

## Requirements

- Bun 1.3
- Docker 29.3

## Getting Started

### 1. 의존성 설치

```bash
bun install
```

### 2. Postgres/Redis 실행

```bash
bun run db:reset
```

기본 포트:

- Web: `3000`
- Proxy: `3001`
- Backend: `3002`
- App Postgres: `5434`
- Catalog Postgres: `5435`
- Serverless Redis HTTP: `8079`

> 참고: `bun run db:reset`은 `docker compose down -v`를 포함해서 **DB 볼륨이 초기화돼고 DB 스키마 반영까지 진행돼요**. 처음부터 다시 시작할 때만 사용해 주세요.

### 3) 서비스 실행

```
bun dev
```

## 기여하기

기여는 언제든 환영해요.

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`SECURITY.md`](SECURITY.md)
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## License

GPL-3.0. 자세한 내용은 [`LICENSE`](LICENSE)를 확인해 주세요.
