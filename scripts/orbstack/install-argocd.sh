#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found. Install k3s first (scripts/orbstack/bootstrap-k3s.sh)."
  exit 1
fi

kubectl get ns argocd >/dev/null 2>&1 || kubectl create namespace argocd

# https://argo-cd.readthedocs.io/en/stable/getting_started/#1-install-argo-cd
kubectl apply \
  -n argocd \
  --server-side \
  --force-conflicts \
  --field-manager=litomi-install-argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for Argo CD server to be ready..."
kubectl -n argocd rollout status deployment/argocd-server --timeout=10m

echo "Argo CD installed."
echo "To open UI: kubectl -n argocd port-forward svc/argocd-server 3010:443"
echo "Initial admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo
