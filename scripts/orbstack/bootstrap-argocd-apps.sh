#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found."
  exit 1
fi

kubectl apply \
  --server-side \
  --force-conflicts \
  --field-manager=litomi-bootstrap-argocd-apps \
  -f k8s/argocd/bootstrap.yaml

echo "Argo CD Applications applied. Check: kubectl -n argocd get applications"
