# Build stage
FROM oven/bun:1.3 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
RUN bun install --ignore-scripts --production --silent --frozen-lockfile

COPY src/ ./src/

# https://bun.com/docs/bundler/executables#deploying-to-production
RUN bun build --compile \
  --minify \
  --sourcemap \
  ./src/index.ts \
  --outfile litomi-backend

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/litomi-backend ./

ENTRYPOINT [ "./litomi-backend" ]
