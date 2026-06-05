# Build stage
FROM oven/bun:1.3 AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock turbo.json tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/cataloger/package.json ./apps/cataloger/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/edge-proxy/package.json ./apps/edge-proxy/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY apps/notifier/package.json ./apps/notifier/package.json
COPY apps/recommender/package.json ./apps/recommender/package.json
COPY packages ./packages

RUN bun install --frozen-lockfile --no-save --silent

COPY tools ./tools

ARG APP_ORIGIN
ARG CI
ARG COMMIT_SHA
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_EDGE_PROXY_ORIGIN
ARG NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN
ARG NEXT_PUBLIC_IMAGE_PROXY_ORIGIN
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_IOS_TESTFLIGHT_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG VAPID_PUBLIC_KEY

ENV BUILD_OUTPUT=standalone
ENV CI=$CI
ENV DO_NOT_TRACK=1
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ORIGIN=$APP_ORIGIN
ENV NEXT_PUBLIC_COMMIT_SHA=$COMMIT_SHA
ENV NEXT_PUBLIC_EDGE_PROXY_ORIGIN=$NEXT_PUBLIC_EDGE_PROXY_ORIGIN
ENV NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN=$NEXT_PUBLIC_EDGE_PROXY_NEW_ORIGIN
ENV NEXT_PUBLIC_IMAGE_PROXY_ORIGIN=$NEXT_PUBLIC_IMAGE_PROXY_ORIGIN
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
ENV NEXT_PUBLIC_IOS_TESTFLIGHT_URL=$NEXT_PUBLIC_IOS_TESTFLIGHT_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

COPY apps/web ./apps/web

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN,required=false \
    --mount=type=secret,id=SENTRY_ORG,env=SENTRY_ORG,required=false \
    --mount=type=secret,id=SENTRY_PROJECT,env=SENTRY_PROJECT,required=false \
    --mount=type=secret,id=APP_POSTGRES_URL,env=APP_POSTGRES_URL,required=false \
    --mount=type=secret,id=APP_POSTGRES_CERTIFICATE,env=APP_POSTGRES_CERTIFICATE,required=false \
    --mount=type=secret,id=CATALOG_POSTGRES_URL,env=CATALOG_POSTGRES_URL,required=false \
    --mount=type=secret,id=CATALOG_POSTGRES_CERTIFICATE,env=CATALOG_POSTGRES_CERTIFICATE,required=false \
    COMMIT_SHA="$COMMIT_SHA" bun run build --filter=@litomi/web \
  # Strip `sourceMappingURL` references (prevents browser `*.map` requests).
  && find apps/web/.next/static -type f -name '*.js' -exec sed -i -E 's@//# sourceMappingURL=.*$@@g' {} + \
  && find apps/web/.next/static -type f -name '*.css' -exec sed -i -E 's@/\*#[[:space:]]*sourceMappingURL=.*\*/@@g' {} +

# Runtime stage
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

CMD ["bun", "apps/web/server.js"]
