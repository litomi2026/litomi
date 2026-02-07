#!/usr/bin/env sh
set -eu

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not found."
  exit 1
fi

kubectl apply -f k8s/argocd/bootstrap.yaml
echo "Argo CD Applications applied. Check: kubectl -n argocd get applications"

