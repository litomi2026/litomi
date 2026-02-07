#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found. Install k3s first (scripts/orbstack/bootstrap-k3s.sh)."
  exit 1
fi

NAMESPACE="${NAMESPACE:-cloudflared}"
SECRET_NAME="${SECRET_NAME:-cloudflared-token}"

TOKEN="${1:-${CLOUDFLARE_TUNNEL_TOKEN:-}}"
if [ -z "${TOKEN}" ]; then
  echo "Usage:"
  echo "  sh scripts/orbstack/set-cloudflared-token-secret.sh <CLOUDFLARE_TUNNEL_TOKEN>"
  echo ""
  echo "Or set env var:"
  echo "  export CLOUDFLARE_TUNNEL_TOKEN='...'"
  exit 1
fi

kubectl get ns "${NAMESPACE}" >/dev/null 2>&1 || kubectl create namespace "${NAMESPACE}"

# token은 GitOps로 올리기 어려우니(비밀), Secret만은 클러스터에 out-of-band로 넣어두고,
# Argo CD는 Deployment/Service 같은 리소스만 관리하는 형태가 가장 단순해요.
kubectl -n "${NAMESPACE}" create secret generic "${SECRET_NAME}" \
  --from-literal=token="${TOKEN}" \
  --dry-run=client -o yaml \
  | kubectl apply \
    --server-side \
    --force-conflicts \
    --field-manager=litomi-orbstack-cloudflared-token \
    -f -

echo "Done."
echo "Check:"
echo "  kubectl -n ${NAMESPACE} get secret ${SECRET_NAME}"

