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

RUN bun install --filter=@litomi/api --ignore-scripts --production --silent --frozen-lockfile

COPY tsconfig.json tsconfig.base.json turbo.json ./
COPY types ./types
COPY apps/api ./apps/api

# https://bun.com/docs/bundler/executables#deploying-to-production
RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  ./apps/api/src/server.ts \
  --target=bun \
  --outfile litomi-api

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/litomi-api ./

ENTRYPOINT [ "./litomi-api" ]
