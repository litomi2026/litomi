# Build stage
FROM oven/bun:1.3 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/cataloger/package.json ./apps/cataloger/package.json
COPY apps/edge-proxy/package.json ./apps/edge-proxy/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY apps/notifier/package.json ./apps/notifier/package.json
COPY apps/recommender/package.json ./apps/recommender/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN bun install --filter=@litomi/notifier --ignore-scripts --production --silent --frozen-lockfile

COPY tsconfig.json tsconfig.base.json turbo.json ./
COPY apps/notifier ./apps/notifier

RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  --target=bun \
  ./apps/notifier/src/index.ts \
  --outfile notifier

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/notifier ./

ENTRYPOINT [ "./notifier" ]
