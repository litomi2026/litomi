# Build stage
FROM oven/bun:1.3 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/catalog-ingest/package.json ./apps/catalog-ingest/package.json
COPY apps/edge-proxy/package.json ./apps/edge-proxy/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY apps/notification-dispatch/package.json ./apps/notification-dispatch/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages

RUN bun install --filter @litomi/catalog-ingest --ignore-scripts --production --silent --frozen-lockfile

COPY tsconfig.json tsconfig.base.json turbo.json ./
COPY apps/catalog-ingest ./apps/catalog-ingest

# Build the application
RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  --target=bun \
  ./apps/catalog-ingest/src/index.ts \
  --outfile catalog-ingest

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

# Copy the compiled binary
COPY --chown=nonroot:nonroot --from=builder /app/catalog-ingest ./

# Set the entrypoint
ENTRYPOINT [ "./catalog-ingest" ]
