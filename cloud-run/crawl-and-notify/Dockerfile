# Build stage
FROM oven/bun:1.2 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock drizzle.config.ts package.json tsconfig.json ./
RUN bun install --ignore-scripts --production --silent --frozen-lockfile

COPY cloud-run/crawl-and-notify ./cloud-run/crawl-and-notify/
COPY src/ ./src/
RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  ./cloud-run/crawl-and-notify/src/index.ts \
  --outfile crawl-and-notify

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/crawl-and-notify ./

ENTRYPOINT [ "./crawl-and-notify" ]