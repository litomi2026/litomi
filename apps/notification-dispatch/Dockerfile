# Build stage
FROM oven/bun:1.3 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock package.json ./
COPY apps/notification-dispatch/package.json ./apps/notification-dispatch/package.json
COPY packages ./packages
RUN bun install --ignore-scripts --production --silent --frozen-lockfile

COPY tsconfig.json turbo.json ./
COPY apps/notification-dispatch ./apps/notification-dispatch

RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  --target=bun \
  ./apps/notification-dispatch/src/index.ts \
  --outfile notification-dispatch

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/notification-dispatch ./

ENTRYPOINT [ "./notification-dispatch" ]
