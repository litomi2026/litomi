# Stage 1: Pruner
FROM oven/bun:1.3-slim AS pruner
WORKDIR /app

COPY . .
RUN bunx turbo prune @litomi/api --docker

# Stage 2: Builder
FROM oven/bun:1.3-slim AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --production --silent --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY turbo.json tsconfig.json tsconfig.base.json ./
COPY types ./types
RUN bunx turbo run build --filter=@litomi/api

# Stage 3: Runtime
FROM gcr.io/distroless/base-nossl-debian12:nonroot
WORKDIR /app

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
ENV NODE_ENV=production

COPY --chown=nonroot:nonroot --from=builder /app/apps/api/dist/litomi-api ./

ENTRYPOINT [ "./litomi-api" ]
