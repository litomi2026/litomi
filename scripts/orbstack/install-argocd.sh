#!/usr/bin/env sh
set -eu

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found. Install k3s first (scripts/orbstack/bootstrap-k3s.sh)."
  exit 1
fi

kubectl get ns argocd >/dev/null 2>&1 || kubectl create namespace argocd

# NOTE: Using the upstream stable manifest keeps this script simple.
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for Argo CD server to be ready..."
kubectl -n argocd rollout status deployment/argocd-server --timeout=10m

echo "Argo CD installed."
echo "To open UI: kubectl -n argocd port-forward svc/argocd-server 8080:443"
echo "Initial admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo

