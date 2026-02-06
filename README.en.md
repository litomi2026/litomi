# litomi

A manga web viewer. The goal is a safe and comfortable reading experience.  
The code is always public and the project is run as open source.

Korean README: [`README.md`](README.md)

## Preview

![Search](public/image/search.webp)
![Bookmarks](public/image/bookmark.webp)

## Features

- **Reading (viewer)**
  - Tap mode / Scroll mode
  - Single page / Double page
  - Vertical paging / Horizontal paging
  - Adjust brightness with vertical swipe
  - Turn pages with horizontal swipe
  - Image layout adjustments
  - Slideshow
  - Resume from last read page
  - Thumbnail preview
  - Tap mode: turn pages with scroll
  - Tap mode: zoom with meta + scroll
  - Scroll mode: adjust image width
- **Search & discovery**
  - Card view / Image view
  - Advanced filters (views/pages/rating/date range, etc.)
  - Sorting (popular / oldest / random)
  - Trending search keywords
  - Recent search keywords
  - New releases
  - Random picks (auto refresh every 20s)
  - “People who liked this also liked” recommendations (based on ratings)
  - Tag browsing by category + Korean tag translations
- **Library & history**
  - Bookmarks
  - Bookmark backup: download/upload (JSON)
  - Reading history
  - Ratings (stars) + rating list
  - Libraries: organize bookmarks by folders
  - Bulk operations: copy / move / remove
  - Data export (password required): bookmarks / history / ratings / libraries / censorship settings
- **Censorship**
  - Keyword-based content censorship
  - Import/export rules (JSON/CSV)
- **Notifications**
  - Notification center: mark as read / delete / filters (unread / new items, etc.)
  - Keyword notifications
  - Web push notifications
- **Rankings**
  - Time-based rankings (views/bookmarks, etc.)
  - Real-time ranking (Google Analytics Data API)
- **Posts (Stories)**
  - Recommended timeline
  - Text/image posts
  - Likes / reposts / comments / views
- **Account & security**
  - Sign up / Login
  - Adult verification (BBaton)
  - Passkey login (WebAuthn)
  - Two-factor authentication (TOTP)
- **Safety**
  - Report a manga
- **Libo (points)**
  - Earn / shop / history
- **App install**
  - PWA install (add to home screen)
  - Android APK install guide

## Tech stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Drizzle ORM
- TanStack Query
- Hono (Backend)

## Local development (Quickstart)

Local development requires running **Postgres + Redis (docker compose) + Backend + Web** together.

### Prerequisites

- Bun (recommended: close to `devDependencies.bun` in `package.json`)
- Docker + Docker Compose

### 1) Install dependencies

```bash
bun install
```

### 2) Start Postgres/Redis (docker compose)

```bash
docker compose up -d
```

Default ports:

- Web: `3000`
- Backend: `3002`
- Postgres: `5434`
- Serverless Redis HTTP: `8079`

> Note: `bun run db:up` includes `docker compose down -v`, which **wipes DB volumes**. Use it only when you want a fresh reset.

### 3) Configure environment variables (`.env.development`)

Example for local development:

```bash
# --- Web (Next.js) ---
NEXT_PUBLIC_BACKEND_URL="http://localhost:3002"
NEXT_PUBLIC_CANONICAL_URL="http://localhost:3000"

# Cloudflare Turnstile (replace with real keys if needed)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="dev-site-key"
TURNSTILE_SECRET_KEY="dev-secret-key"

# Web Push (replace with real keys if needed)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="dev-vapid-public-key"
VAPID_PRIVATE_KEY="dev-vapid-private-key"

# --- Backend (Hono) ---
CORS_ORIGIN="http://localhost:3000"

# Third-party (dev can start with dummy values)
ADSTERRA_API_KEY="dev"
BBATON_CLIENT_ID="dev"
BBATON_CLIENT_SECRET="dev"

# --- Database (Postgres) ---
POSTGRES_URL="postgresql://test_user:test_password@localhost:5434/test_db"
POSTGRES_URL_DIRECT="postgresql://test_user:test_password@localhost:5434/test_db"

# Aiven DB can point to the same local DB for development
AIVEN_POSTGRES_URL="postgresql://test_user:test_password@localhost:5434/test_db"

# --- Redis (Serverless Redis HTTP; launched via docker compose) ---
UPSTASH_KV_REST_API_URL="http://localhost:8079"
UPSTASH_KV_REST_API_TOKEN="local_dev_token"

# --- Auth / Security (dev secrets) ---
JWT_SECRET_ACCESS_TOKEN="dev-access"
JWT_SECRET_REFRESH_TOKEN="dev-refresh"
JWT_SECRET_TRUSTED_DEVICE="dev-trusted-device"
JWT_SECRET_BBATON_ATTEMPT="dev-bbaton-attempt"

# Must be a 64-character hex string
# bun run tools/generateEncryptionKey.ts
TOTP_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Optional
# NEXT_PUBLIC_GA_ID=""
# NEXT_PUBLIC_IOS_TESTFLIGHT_URL=""
# AMPLITUDE_API_KEY=""
# GA_PROPERTY_ID=""
# GA_SERVICE_ACCOUNT_EMAIL=""
# GA_SERVICE_ACCOUNT_KEY=""
```

### 4) Apply DB schema (Drizzle)

```bash
# Supabase schema
bun run db:push

# Aiven schema
bun run db:push:aiven
```

### 5) Start Backend

```bash
bun run dev:backend
```

### 6) Start Web

```bash
bun dev
```

## Testing

- Docs: [`docs/testing.md`](docs/testing.md)
- Common commands:
  - `bun test`
  - `bun run test:e2e`

## Mobile

- Docs: [`docs/mobile-distribution.md`](docs/mobile-distribution.md)

## Deployment

- **Vercel (Web)**: for deploying the Next.js app.
- **Cloud Run (Job)**: for periodic jobs (sync/notify).
  - [`cloud-run/manga-crawl/README.md`](cloud-run/manga-crawl/README.md)
  - [`cloud-run/crawl-and-notify/README.md`](cloud-run/crawl-and-notify/README.md)

## Contributing

Contributions are welcome.

- [`CONTRIBUTING.md`](CONTRIBUTING.md) / [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md)
- [`SECURITY.md`](SECURITY.md) / [`SECURITY.en.md`](SECURITY.en.md)
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## License

GPL-3.0. See [`LICENSE`](LICENSE).
