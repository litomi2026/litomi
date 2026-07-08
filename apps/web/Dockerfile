# Stage 1: Pruner
FROM oven/bun:1.3-alpine AS pruner
WORKDIR /app

ENV DO_NOT_TRACK=1
ENV TURBO_TELEMETRY_DISABLED=1

COPY . .
RUN bunx turbo prune @litomi/web --docker

# Stage 2: Builder
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

ARG CI
ARG COMMIT_SHA
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_APP_ORIGIN
ARG NEXT_PUBLIC_PROXY_ORIGIN
ARG NEXT_PUBLIC_PROXY_NEW_ORIGIN
ARG NEXT_PUBLIC_FARO_URL
ARG NEXT_PUBLIC_IMAGE_PROXY_ORIGIN
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_IOS_TESTFLIGHT_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY

ENV BUILD_OUTPUT=standalone
ENV CI=$CI
ENV DO_NOT_TRACK=1
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ORIGIN=$NEXT_PUBLIC_APP_ORIGIN
ENV NEXT_PUBLIC_COMMIT_SHA=$COMMIT_SHA
ENV NEXT_PUBLIC_PROXY_ORIGIN=$NEXT_PUBLIC_PROXY_ORIGIN
ENV NEXT_PUBLIC_PROXY_NEW_ORIGIN=$NEXT_PUBLIC_PROXY_NEW_ORIGIN
ENV NEXT_PUBLIC_FARO_URL=$NEXT_PUBLIC_FARO_URL
ENV NEXT_PUBLIC_IMAGE_PROXY_ORIGIN=$NEXT_PUBLIC_IMAGE_PROXY_ORIGIN
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_IOS_TESTFLIGHT_URL=$NEXT_PUBLIC_IOS_TESTFLIGHT_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --no-save --silent

COPY --from=pruner /app/out/full/ .
COPY turbo.json tsconfig.json tsconfig.base.json ./
COPY types ./types
COPY tools ./tools

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN,required=false \
    --mount=type=secret,id=APP_POSTGRES_URL,env=APP_POSTGRES_URL,required=false \
    --mount=type=secret,id=APP_POSTGRES_CERTIFICATE,env=APP_POSTGRES_CERTIFICATE,required=false \
    --mount=type=secret,id=CATALOG_POSTGRES_URL,env=CATALOG_POSTGRES_URL,required=false \
    --mount=type=secret,id=CATALOG_POSTGRES_CERTIFICATE,env=CATALOG_POSTGRES_CERTIFICATE,required=false \
    COMMIT_SHA="$COMMIT_SHA" bunx turbo run build --filter=@litomi/web \
  # Strip `sourceMappingURL` references (prevents browser `*.map` requests).
  && find apps/web/.next/static -type f -name '*.js' -exec sed -i -E 's@//# sourceMappingURL=.*$@@g' {} + \
  && find apps/web/.next/static -type f -name '*.css' -exec sed -i -E 's@/\*#[[:space:]]*sourceMappingURL=.*\*/@@g' {} +

# Stage 3: Runtime
FROM node:26-alpine AS runner
WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1536

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

CMD ["node", "apps/web/server.js"]
