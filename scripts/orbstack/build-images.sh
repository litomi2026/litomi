#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Install Docker (or build images on another machine and push/import)."
  exit 1
fi

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
    return 0
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo docker "$@"
    return 0
  fi
  echo "docker daemon is not accessible (and sudo is not available)." >&2
  exit 1
}

DOMAIN="${DOMAIN:-litomi.in}"
IMAGE_TAG="${IMAGE_TAG:-prod}"
EXTERNAL_API_PROXY_URL="${EXTERNAL_API_PROXY_URL:-}"

case "${IMAGE_TAG}" in
  stg)
    WEB_HOST="${WEB_HOST:-stg.${DOMAIN}}"
    API_HOST="${API_HOST:-api-stg.${DOMAIN}}"
    ;;
  *)
    WEB_HOST="${WEB_HOST:-${DOMAIN}}"
    API_HOST="${API_HOST:-api.${DOMAIN}}"
    ;;
esac

if [ -z "${COMMIT_SHA:-}" ]; then
  if command -v git >/dev/null 2>&1; then
    COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || true)"
  fi
fi
COMMIT_SHA="${COMMIT_SHA:-$IMAGE_TAG}"

NEXT_PUBLIC_CANONICAL_URL="https://${WEB_HOST}"
NEXT_PUBLIC_BACKEND_URL="https://${API_HOST}"

if [ -z "${EXTERNAL_API_PROXY_URL}" ]; then
  if [ "${IMAGE_TAG}" = "stg" ]; then
    EXTERNAL_API_PROXY_URL="https://vercel-stg.${DOMAIN}"
  else
    EXTERNAL_API_PROXY_URL="https://vercel.${DOMAIN}"
  fi
fi

NEXT_PUBLIC_EXTERNAL_API_PROXY_URL="${EXTERNAL_API_PROXY_URL}"

POSTGRES_URL="${POSTGRES_URL:-postgresql://litomi:test_password@postgres:5432/litomi}"

echo "Building images with:"
echo "  NEXT_PUBLIC_CANONICAL_URL=${NEXT_PUBLIC_CANONICAL_URL}"
echo "  NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}"
echo "  NEXT_PUBLIC_EXTERNAL_API_PROXY_URL=${NEXT_PUBLIC_EXTERNAL_API_PROXY_URL}"
echo "  IMAGE_TAG=${IMAGE_TAG}"
echo "  COMMIT_SHA=${COMMIT_SHA}"

docker_cmd build \
  -t "litomi-web:${IMAGE_TAG}" \
  -f Dockerfile.nextjs \
  --build-arg "CI=true" \
  --build-arg "COMMIT_SHA=${COMMIT_SHA}" \
  --build-arg "NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}" \
  --build-arg "NEXT_PUBLIC_CANONICAL_URL=${NEXT_PUBLIC_CANONICAL_URL}" \
  --build-arg "NEXT_PUBLIC_EXTERNAL_API_PROXY_URL=${NEXT_PUBLIC_EXTERNAL_API_PROXY_URL}" \
  --build-arg "POSTGRES_URL=${POSTGRES_URL}" \
  .

docker_cmd build \
  -t "litomi-backend:${IMAGE_TAG}" \
  -f Dockerfile.hono \
  .

echo "Done."

