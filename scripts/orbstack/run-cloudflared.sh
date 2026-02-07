#!/usr/bin/env sh
set -eu

TOKEN="${1:-${CLOUDFLARE_TUNNEL_TOKEN:-}}"
IMAGE="${CLOUDFLARED_IMAGE:-cloudflare/cloudflared:2026.1.2}"
if [ -z "${TOKEN}" ]; then
  echo "Usage:"
  echo "  sh scripts/orbstack/run-cloudflared.sh <CLOUDFLARE_TUNNEL_TOKEN>"
  echo ""
  echo "Or set env var:"
  echo "  export CLOUDFLARE_TUNNEL_TOKEN='...'"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Install docker first."
  exit 1
fi

# Optional quick check: is something listening on :80 (k3s traefik should).
if command -v ss >/dev/null 2>&1; then
  if ! ss -ltn | grep -q ':80 '; then
    echo "⚠️  Nothing seems to be listening on :80 yet."
    echo "   Make sure k3s/traefik ingress is up: kubectl -n kube-system get svc traefik"
  fi
fi

sudo docker rm -f cloudflared 2>/dev/null || true
sudo docker run -d \
  --name cloudflared \
  --restart unless-stopped \
  --network host \
  "${IMAGE}" \
  tunnel \
  --no-autoupdate \
  --protocol http2 \
  --metrics 127.0.0.1:2000 \
  run \
  --token "${TOKEN}"

echo "cloudflared is running."
echo "Health: curl -fsS http://127.0.0.1:2000/ready"

