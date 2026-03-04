#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BIN="$ROOT_DIR/bin/litomi-local-search"
DATA_DIR="$ROOT_DIR/data"

# You can override this with: export LITOMI_ORT_DYLIB="/path/to/libonnxruntime.dylib"
ORT_DYLIB="${LITOMI_ORT_DYLIB:-}"

if [[ ! -x "$BIN" ]]; then
  echo "Binary not found or not executable: $BIN" >&2
  echo "Build it first: cargo build --release --manifest-path local-search/Cargo.toml" >&2
  exit 1
fi

if [[ -n "$ORT_DYLIB" ]]; then
  exec "$BIN" serve --data-dir "$DATA_DIR" --ort-dylib "$ORT_DYLIB"
else
  exec "$BIN" serve --data-dir "$DATA_DIR"
fi

