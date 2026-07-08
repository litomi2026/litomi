# Stage 1: Pruner
FROM oven/bun:1.3-slim AS pruner
WORKDIR /app

ENV DO_NOT_TRACK=1
ENV TURBO_TELEMETRY_DISABLED=1

COPY . .
RUN bunx turbo prune @litomi/proxy --docker

# Stage 2: Builder
FROM oven/bun:1.3-slim AS builder
WORKDIR /app

ENV DO_NOT_TRACK=1
ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --silent --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY turbo.json tsconfig.json tsconfig.base.json ./
COPY types ./types
RUN bunx turbo run build --filter=@litomi/proxy

# Stage 3: Runtime
FROM gcr.io/distroless/base-nossl-debian13:nonroot
WORKDIR /app

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
ENV NODE_ENV=production

COPY --chown=nonroot:nonroot --from=builder /app/apps/proxy/dist/litomi-proxy ./

ENTRYPOINT [ "./litomi-proxy" ]
