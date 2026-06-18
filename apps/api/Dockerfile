# Stage 1: Pruner
FROM oven/bun:1.3 AS pruner
WORKDIR /app

COPY . .
RUN bunx turbo prune @litomi/api --docker

# Stage 2: Builder
FROM oven/bun:1.3 AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --production --silent --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY types ./types
RUN bunx turbo run build --filter=@litomi/api

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

COPY --chown=nonroot:nonroot --from=builder /app/apps/api/dist/litomi-api ./

ENTRYPOINT [ "./litomi-api" ]
