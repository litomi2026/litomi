#!/usr/bin/env sh
set -eu

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found."
  exit 1
fi

if ! command -v k3s >/dev/null 2>&1; then
  echo "k3s not found. Install k3s first (scripts/orbstack/bootstrap-k3s.sh)."
  exit 1
fi

TMP_DIR="${TMP_DIR:-/tmp/litomi-k3s-images}"
IMAGE_TAG="${IMAGE_TAG:-prod}"
mkdir -p "$TMP_DIR"

import_image() {
  name="$1"
  tar="$TMP_DIR/$2"
  echo "Saving $name -> $tar"
  docker save "$name" -o "$tar"
  echo "Importing $tar into k3s containerd..."
  k3s ctr images import "$tar"
}

import_image "litomi-web:${IMAGE_TAG}" "litomi-web.tar"
import_image "litomi-backend:${IMAGE_TAG}" "litomi-backend.tar"

echo "Done. You can check: k3s ctr images ls | grep litomi"

