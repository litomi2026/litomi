FROM oven/bun:1.2-alpine AS base

# Install dependencies for production
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .

# Production stage
FROM base AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY cloud-run/ ./cloud-run/
COPY src/ ./src/

ENV NODE_ENV=production

CMD ["bun", "--conditions=react-server", "cloud-run/crawlAndNotify.ts"]
