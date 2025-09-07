# Build stage
FROM oven/bun:1.2 AS builder

ENV NODE_ENV=production
WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
RUN bun install --ignore-scripts --production --silent --frozen-lockfile

COPY cloud-run/manga-crawl/ ./cloud-run/manga-crawl/
COPY src/ ./src/

# Build the application
RUN bun build --compile \
  --conditions=react-server \
  --minify \
  --sourcemap \
  ./cloud-run/manga-crawl/src/index.ts \
  --outfile manga-crawl

# Runtime stage
FROM gcr.io/distroless/base-nossl-debian12:nonroot

ENV NODE_ENV=production
WORKDIR /home

# Copy the compiled binary
COPY --chown=nonroot:nonroot --from=builder /app/manga-crawl ./

# Set the entrypoint
ENTRYPOINT [ "./manga-crawl" ]
