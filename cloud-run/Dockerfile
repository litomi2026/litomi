# Build stage
FROM oven/bun:1.2 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock drizzle.config.ts package.json tsconfig.json ./
RUN bun install --ignore-scripts --production --silent --frozen-lockfile

COPY cloud-run/ ./cloud-run/
COPY src/ ./src/
RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  # --bytecode \
  ./cloud-run/src/crawl.ts \
  --outfile crawl

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/crawl ./

ENTRYPOINT [ "./crawl" ]