# Build stage
FROM oven/bun:1.3 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages
RUN bun install --ignore-scripts --production --silent --frozen-lockfile

COPY tsconfig.json turbo.json ./
COPY apps/api ./apps/api

# https://bun.com/docs/bundler/executables#deploying-to-production
RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  ./apps/api/src/backend/index.ts \
  --target=bun \
  --outfile litomi-backend

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/litomi-backend ./

ENTRYPOINT [ "./litomi-backend" ]
