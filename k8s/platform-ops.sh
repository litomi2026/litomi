#!/usr/bin/env bash

set -euo pipefail

SCRIPT_PATH="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/$(basename -- "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

if [[ "$(id -u)" -eq 0 ]]; then
  SUDO_ARR=()
else
  SUDO_ARR=(sudo)
fi

if [[ ${#SUDO_ARR[@]} -eq 0 ]]; then
  DEFAULT_KUBECTL_CMD="kubectl"
else
  DEFAULT_KUBECTL_CMD="sudo kubectl"
fi

MODE="init"
SKIP_PUBLIC_CHECK="false"

SCRIPT_START_EPOCH="$(date +%s)"
OK_COUNT=0
WARN_COUNT=0

UI_WIDTH="${UI_WIDTH:-84}"
UI_USE_COLOR="false"
if [[ -t 1 ]]; then
  if [[ -z "${NO_COLOR:-}" ]]; then
    UI_USE_COLOR="true"
  fi
  if command -v tput >/dev/null 2>&1; then
    UI_COLS="$(tput cols 2>/dev/null || true)"
    if [[ "$UI_COLS" =~ ^[0-9]+$ ]] && (( UI_COLS >= 60 )); then
      UI_WIDTH="$UI_COLS"
    fi
  fi
fi

if [[ "$UI_USE_COLOR" == "true" ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_BLUE=$'\033[34m'
  C_CYAN=$'\033[36m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'
else
  C_RESET=""
  C_BOLD=""
  C_DIM=""
  C_BLUE=""
  C_CYAN=""
  C_GREEN=""
  C_YELLOW=""
  C_RED=""
fi

KUBECTL_CMD="${KUBECTL_CMD:-$DEFAULT_KUBECTL_CMD}"
read -r -a KUBECTL_ARR <<< "${KUBECTL_CMD}"

BOOT_WAIT_SECONDS="${BOOT_WAIT_SECONDS:-900}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-5}"
WAIT_PROGRESS_EVERY_SECONDS="${WAIT_PROGRESS_EVERY_SECONDS:-30}"
PUBLIC_URLS="${PUBLIC_URLS:-https://argocd.litomi.in/,https://litomi.in/,https://api.litomi.in/health}"
KUBECTL_EXEC_TIMEOUT_SECONDS="${KUBECTL_EXEC_TIMEOUT_SECONDS:-120}"

VAULT_NAMESPACE="${VAULT_NAMESPACE:-vault}"
VAULT_POD="${VAULT_POD:-vault-0}"
VAULT_ADDR="${VAULT_ADDR:-https://vault.vault.svc:8200}"
VAULT_CACERT="${VAULT_CACERT:-/vault/userconfig/vault-tls/ca.crt}"
VAULT_TLS_DIR="${VAULT_TLS_DIR:-$HOME/vault-tls}"
VAULT_INIT_OUTPUT="${VAULT_INIT_OUTPUT:-${VAULT_TLS_DIR}/vault-init.json}"
VAULT_SECRETS_DIR="${VAULT_SECRETS_DIR:-${REPO_ROOT}/k8s/vault-secrets}"

SERVICE_NAME="litomi-platform-reboot.service"
SERVICE_UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}"

VAULT_CA_NAMESPACES=(
  "litomi-prod"
  "litomi-stg"
  "cloudflared"
  "monitoring"
  "velero"
  "minio"
  "logging"
  "tracing"
)

VAULT_POLICY_SPECS=(
  "litomi-prod-read|litomi-prod"
  "litomi-stg-read|litomi-stg"
  "cloudflared-read|cloudflared"
  "monitoring-read|monitoring"
  "velero-read|velero"
  "minio-read|minio"
)

VAULT_ROLE_SPECS=(
  "eso-litomi-prod|litomi-prod|litomi-prod-read"
  "eso-litomi-stg|litomi-stg|litomi-stg-read"
  "eso-cloudflared|cloudflared|cloudflared-read"
  "eso-monitoring|monitoring|monitoring-read"
  "eso-velero|velero|velero-read"
  "eso-minio|minio|minio-read"
  "eso-logging|logging|minio-read"
  "eso-tracing|tracing|minio-read"
)

REQUIRED_SEED_FILES=(
  "litomi-prod/litomi-backend-secret.env"
  "litomi-stg/litomi-backend-secret.env"
  "cloudflared/cloudflared-token.env"
  "monitoring/grafana-admin.env"
  "monitoring/alertmanager-discord-webhook-warning.env"
  "monitoring/alertmanager-discord-webhook-critical.env"
  "velero/velero-cloud-credentials.env"
  "minio/minio-root.env"
)

REQUIRED_CLUSTER_SECRETS=(
  "litomi-prod|litomi-backend-secret"
  "litomi-stg|litomi-backend-secret"
  "cloudflared|cloudflared-token"
  "monitoring|grafana-admin"
  "monitoring|alertmanager-discord-webhook-warning"
  "monitoring|alertmanager-discord-webhook-critical"
  "velero|velero-cloud-credentials"
  "minio|minio-env-configuration"
  "logging|loki-minio"
  "tracing|tempo-minio"
)

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./k8s/platform-ops.sh [options]

Core options:
  --mode <init|reboot>         Run full bootstrap (init, default) or reboot reconciliation
  --vault-secrets-dir <dir>    Directory with Vault seed .env files (default: ./k8s/vault-secrets)
  --skip-public-check          Skip public URL checks
  -h, --help                   Show help

Environment overrides:
  KUBECTL_CMD, BOOT_WAIT_SECONDS, CHECK_INTERVAL_SECONDS, PUBLIC_URLS,
  VAULT_ADDR, VAULT_CACERT, VAULT_TLS_DIR, VAULT_INIT_OUTPUT,
  WAIT_PROGRESS_EVERY_SECONDS, KUBECTL_EXEC_TIMEOUT_SECONDS

Notes:
  - init mode is idempotent and installs/updates a reboot systemd service automatically.
  - reboot mode focuses on Vault unseal/reconcile/checks and does not reinstall k3s/Argo.
  - In .env files, use double quotes to decode escapes like \n, \r, \t, \" and \\.
EOF_USAGE
}

log() {
  local msg="$*"
  if [[ "$msg" =~ ^Step[[:space:]][0-9]+/[0-9]+: ]]; then
    printf '\n'
    hr "="
    printf '%s[STEP ]%s %s\n' "${C_BOLD}${C_CYAN}" "$C_RESET" "$msg"
    hr "="
    return
  fi
  printf '%s[%s]%s %s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$C_RESET" "$msg"
}

ok() {
  OK_COUNT=$((OK_COUNT + 1))
  printf '%s[ OK  ]%s %s\n' "$C_GREEN" "$C_RESET" "$*"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  printf '%s[WARN ]%s %s\n' "$C_YELLOW" "$C_RESET" "$*"
}

die() {
  printf '%s[FAIL ]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
  print_summary "FAIL" "$*" >&2
  exit 1
}

run() {
  printf '%s[CMD  ]%s %s\n' "$C_BLUE" "$C_RESET" "$*"
  "$@"
}

hr() {
  local char="${1:--}"
  printf '%*s\n' "$UI_WIDTH" '' | tr ' ' "$char"
}

elapsed_seconds() {
  echo $(( $(date +%s) - SCRIPT_START_EPOCH ))
}

format_elapsed() {
  local seconds="${1:-0}"
  printf '%02dm%02ds' "$((seconds / 60))" "$((seconds % 60))"
}

should_emit_wait_log() {
  local waited="${1:-0}"
  local every="${WAIT_PROGRESS_EVERY_SECONDS:-30}"
  if ! [[ "$every" =~ ^[0-9]+$ ]] || (( every <= 0 )); then
    every=30
  fi
  (( waited % every == 0 ))
}

print_summary() {
  local status="$1"
  local detail="${2:-}"
  local color="$C_GREEN"
  local elapsed

  if [[ "$status" == "FAIL" ]]; then
    color="$C_RED"
  fi

  elapsed="$(format_elapsed "$(elapsed_seconds)")"
  printf '\n'
  hr "="
  printf '%s[RESULT]%s %s | ok=%d warn=%d | elapsed=%s\n' \
    "${C_BOLD}${color}" "$C_RESET" "$status" "$OK_COUNT" "$WARN_COUNT" "$elapsed"
  if [[ -n "$detail" ]]; then
    printf '         %s\n' "$detail"
  fi
  hr "="
}

run_root() {
  if [[ ${#SUDO_ARR[@]} -eq 0 ]]; then
    run "$@"
  else
    run "${SUDO_ARR[@]}" "$@"
  fi
}

k() {
  "${KUBECTL_ARR[@]}" "$@"
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

assert_file_exists() {
  local path="$1"
  [[ -f "$path" ]] || die "Missing file: $path"
}

assert_command_exists() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Missing command: $cmd"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --mode)
        MODE="${2:-}"
        shift 2
        ;;
      --vault-secrets-dir)
        VAULT_SECRETS_DIR="${2:-}"
        shift 2
        ;;
      --skip-public-check)
        SKIP_PUBLIC_CHECK="true"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        usage
        die "Unknown argument: $1"
        ;;
    esac
  done

  if [[ "$MODE" != "init" && "$MODE" != "reboot" ]]; then
    die "--mode must be init or reboot"
  fi
}

ensure_host_dependencies() {
  local required=(curl openssl python3 awk sed base64 find sort iptables-save ip6tables-save)
  local cmd missing=()

  for cmd in "${required[@]}"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing+=("$cmd")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    ok "host dependencies already available"
    return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    log "Installing missing host dependencies with apt: ${missing[*]}"
    run_root apt-get update
    run_root apt-get install -y curl openssl python3 coreutils findutils iptables
  else
    die "Missing commands (${missing[*]}), and apt-get is unavailable. Install them manually first."
  fi

  for cmd in "${required[@]}"; do
    assert_command_exists "$cmd"
  done
  ok "host dependencies installed"
}

wait_for_node_registration() {
  local waited=0
  local count

  while (( waited < BOOT_WAIT_SECONDS )); do
    count="$(
      k get nodes -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | awk '{print NF}' || echo 0
    )"
    if [[ "${count:-0}" =~ ^[0-9]+$ ]] && (( count > 0 )); then
      ok "kubernetes node registered (${count})"
      return
    fi
    if should_emit_wait_log "$waited"; then
      log "waiting for kubernetes node registration (${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  k get nodes -o wide || true
  die "no kubernetes node registered within ${BOOT_WAIT_SECONDS}s"
}

namespace_exists() {
  local ns="$1"
  k get namespace "$ns" >/dev/null 2>&1
}

resource_exists() {
  local ns="$1"
  local kind="$2"
  local name="$3"
  k -n "$ns" get "${kind}/${name}" >/dev/null 2>&1
}

wait_for_api_ready() {
  local waited=0
  while (( waited < BOOT_WAIT_SECONDS )); do
    if k get --raw='/readyz' 2>/dev/null | grep -q 'ok'; then
      ok "kubernetes api is ready"
      return
    fi
    if should_emit_wait_log "$waited"; then
      log "waiting for kubernetes api readyz (${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done
  die "kubernetes api not ready within ${BOOT_WAIT_SECONDS}s"
}

wait_for_namespace() {
  local ns="$1"
  local waited=0
  while (( waited < BOOT_WAIT_SECONDS )); do
    if namespace_exists "$ns"; then
      ok "namespace ready: $ns"
      return
    fi
    if should_emit_wait_log "$waited"; then
      log "waiting for namespace: ${ns} (${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done
  die "namespace not found within timeout: $ns"
}

wait_for_resource() {
  local ns="$1"
  local kind="$2"
  local name="$3"
  local waited=0
  while (( waited < BOOT_WAIT_SECONDS )); do
    if resource_exists "$ns" "$kind" "$name"; then
      ok "resource ready: ${ns}/${kind}/${name}"
      return
    fi
    if should_emit_wait_log "$waited"; then
      log "waiting for resource: ${ns}/${kind}/${name} (${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done
  die "resource not found within timeout: ${ns}/${kind}/${name}"
}

ensure_k3s_if_needed() {
  log "Step 1/9: k3s install/check"

  if k get nodes >/dev/null 2>&1; then
    ok "kubernetes api already reachable"
  else
    if [[ "$MODE" != "init" ]]; then
      die "kubernetes api unreachable in reboot mode"
    fi

    run_root bash -c 'curl -sfL https://get.k3s.io | sh -s - server --cluster-init --secrets-encryption'
    ok "k3s install command completed"
  fi

  wait_for_api_ready
  wait_for_node_registration

  if ! k wait --for=condition=Ready node --all --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
    k get nodes -o wide || true
    die "node readiness check failed"
  fi
  ok "all nodes are Ready"
}

ensure_argocd_bootstrap_and_control_plane() {
  log "Step 2/9: Argo CD bootstrap/control plane"

  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/argocd/kustomization.yaml"
  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"

  if [[ "$MODE" == "init" ]]; then
    run k apply --server-side --force-conflicts -k "${REPO_ROOT}/k8s/bootstrap/argocd"
    run k apply -f "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"
    ok "Argo CD bootstrap and root app applied"
  else
    ok "reboot mode: skip bootstrap apply"
  fi

  wait_for_resource argocd deployment argocd-repo-server
  wait_for_resource argocd statefulset argocd-application-controller

  log "waiting rollout: argocd/deployment argocd-repo-server"
  if ! k -n argocd rollout status deployment/argocd-repo-server --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
    k -n argocd get pods -o wide || true
    k -n argocd describe deployment/argocd-repo-server || true
    die "argocd-repo-server rollout failed"
  fi
  ok "argocd-repo-server rollout complete"

  log "waiting rollout: argocd/statefulset argocd-application-controller"
  if ! k -n argocd rollout status statefulset/argocd-application-controller --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
    k -n argocd get pods -o wide || true
    k -n argocd describe statefulset/argocd-application-controller || true
    die "argocd-application-controller rollout failed"
  fi
  ok "argocd-application-controller rollout complete"

  wait_for_resource argocd applications.argoproj.io root
}

write_secret_field_to_file() {
  local ns="$1"
  local name="$2"
  local key_jsonpath="$3"
  local output_file="$4"
  local encoded

  encoded="$(k -n "$ns" get "secret/${name}" -o "jsonpath={.data.${key_jsonpath}}" 2>/dev/null || true)"
  [[ -n "$encoded" ]] || return 1

  if ! printf '%s' "$encoded" | base64 -d >"$output_file" 2>/dev/null; then
    rm -f "$output_file"
    return 1
  fi

  [[ -s "$output_file" ]] || return 1
}

generate_vault_tls_files() {
  mkdir -p "$VAULT_TLS_DIR"

  local ca_key="${VAULT_TLS_DIR}/ca.key"
  local ca_crt="${VAULT_TLS_DIR}/ca.crt"
  local tls_key="${VAULT_TLS_DIR}/tls.key"
  local tls_csr="${VAULT_TLS_DIR}/tls.csr"
  local tls_crt="${VAULT_TLS_DIR}/tls.crt"
  local server_cnf="${VAULT_TLS_DIR}/server.cnf"

  if [[ -f "$ca_crt" && -f "$tls_crt" && -f "$tls_key" ]]; then
    ok "vault tls files already exist: ${VAULT_TLS_DIR}"
    return
  fi

  run openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -subj '/CN=litomi-vault-ca' \
    -keyout "$ca_key" -out "$ca_crt"

  cat >"$server_cnf" <<'EOF_CNF'
[req]
distinguished_name = dn
req_extensions = req_ext
prompt = no

[dn]
CN = vault.vault.svc

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = vault.vault.svc
DNS.2 = vault.vault.svc.cluster.local
EOF_CNF

  run openssl req -new -newkey rsa:4096 -nodes -sha256 \
    -keyout "$tls_key" -out "$tls_csr" -config "$server_cnf"

  run openssl x509 -req -sha256 -days 825 \
    -in "$tls_csr" -CA "$ca_crt" -CAkey "$ca_key" -CAcreateserial \
    -out "$tls_crt" -extensions req_ext -extfile "$server_cnf"

  ok "generated vault tls assets"
}

sync_vault_ca_configmaps_from_file() {
  local source_ca="$1"
  local ns

  for ns in "${VAULT_CA_NAMESPACES[@]}"; do
    if ! namespace_exists "$ns"; then
      warn "namespace missing for vault-ca sync: $ns"
      continue
    fi

    k -n "$ns" create configmap vault-ca \
      --from-file=ca.crt="$source_ca" \
      --dry-run=client -o yaml | k apply -f - >/dev/null
    ok "synced vault-ca configmap: ${ns}/vault-ca"
  done
}

ensure_vault_tls_assets() {
  log "Step 3/9: Vault TLS assets"

  wait_for_namespace "$VAULT_NAMESPACE"

  local secret_exists="false"
  if resource_exists "$VAULT_NAMESPACE" secret vault-tls; then
    secret_exists="true"
    ok "vault tls secret already exists"
  fi

  if [[ "$secret_exists" == "false" ]]; then
    if [[ "$MODE" != "init" ]]; then
      die "missing ${VAULT_NAMESPACE}/vault-tls in reboot mode"
    fi

    generate_vault_tls_files

    assert_file_exists "${VAULT_TLS_DIR}/ca.crt"
    assert_file_exists "${VAULT_TLS_DIR}/tls.crt"
    assert_file_exists "${VAULT_TLS_DIR}/tls.key"

    k -n "$VAULT_NAMESPACE" create secret generic vault-tls \
      --from-file=tls.crt="${VAULT_TLS_DIR}/tls.crt" \
      --from-file=tls.key="${VAULT_TLS_DIR}/tls.key" \
      --from-file=ca.crt="${VAULT_TLS_DIR}/ca.crt" \
      --dry-run=client -o yaml | k apply -f - >/dev/null

    ok "applied ${VAULT_NAMESPACE}/vault-tls"
    sync_vault_ca_configmaps_from_file "${VAULT_TLS_DIR}/ca.crt"
    return
  fi

  local tmp_ca
  tmp_ca="$(mktemp)"
  if ! write_secret_field_to_file "$VAULT_NAMESPACE" vault-tls 'ca\.crt' "$tmp_ca"; then
    rm -f "$tmp_ca"
    die "failed to read ca.crt from ${VAULT_NAMESPACE}/vault-tls"
  fi

  sync_vault_ca_configmaps_from_file "$tmp_ca"
  rm -f "$tmp_ca"
}

wait_for_vault_pod_running() {
  wait_for_resource "$VAULT_NAMESPACE" pod "$VAULT_POD"

  local waited=0
  local phase node waiting_reason restart_count
  while (( waited < BOOT_WAIT_SECONDS )); do
    phase="$(k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
    if [[ "$phase" == "Running" ]]; then
      ok "vault pod is running: ${VAULT_NAMESPACE}/${VAULT_POD}"
      return
    fi

    if should_emit_wait_log "$waited"; then
      node="$(k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" -o jsonpath='{.spec.nodeName}' 2>/dev/null || true)"
      waiting_reason="$(
        k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" \
          -o jsonpath='{range .status.containerStatuses[*]}{.state.waiting.reason}{" "}{end}' 2>/dev/null || true
      )"
      restart_count="$(
        k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" \
          -o jsonpath='{range .status.containerStatuses[*]}{.restartCount}{" "}{end}' 2>/dev/null || true
      )"
      log "waiting for vault pod Running (phase=${phase:-<empty>}, node=${node:-<none>}, waiting=${waiting_reason:-<none>}, restarts=${restart_count:-0}, ${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  warn "vault pod diagnostic: ${VAULT_NAMESPACE}/${VAULT_POD}"
  k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" -o wide || true
  k -n "$VAULT_NAMESPACE" describe "pod/${VAULT_POD}" || true
  k -n "$VAULT_NAMESPACE" logs "pod/${VAULT_POD}" --tail=200 || true
  die "vault pod is not running: ${VAULT_NAMESPACE}/${VAULT_POD}"
}

vault_exec() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "${KUBECTL_EXEC_TIMEOUT_SECONDS}s" \
      k -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
      env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" "$@"
    return
  fi
  k -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" "$@"
}

vault_exec_token() {
  local token="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "${KUBECTL_EXEC_TIMEOUT_SECONDS}s" \
      k -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
      env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" VAULT_TOKEN="$token" "$@"
    return
  fi
  k -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" VAULT_TOKEN="$token" "$@"
}

vault_status_output() {
  local output
  output="$(vault_exec vault status -format=json 2>/dev/null || true)"
  if [[ -n "$output" ]]; then
    printf '%s\n' "$output"
    return
  fi
  vault_exec vault status 2>/dev/null || true
}

vault_is_initialized() {
  local status
  status="$(vault_status_output)"
  if printf '%s\n' "$status" | grep -Eq '"initialized"[[:space:]]*:[[:space:]]*true'; then
    return 0
  fi
  if printf '%s\n' "$status" | grep -Eq 'Initialized[[:space:]]+true'; then
    return 0
  fi
  return 1
}

vault_is_sealed() {
  local status
  status="$(vault_status_output)"
  if printf '%s\n' "$status" | grep -Eq '"sealed"[[:space:]]*:[[:space:]]*true'; then
    return 0
  fi
  if printf '%s\n' "$status" | grep -Eq 'Sealed[[:space:]]+true'; then
    return 0
  fi
  return 1
}

extract_root_token_from_json() {
  local json_file="$1"
  python3 - "$json_file" <<'EOF_PY'
import json
import sys

try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception:
    sys.exit(1)

token = data.get("root_token", "")
if token:
    print(token)
EOF_PY
}

extract_unseal_keys_from_json() {
  local json_file="$1"
  python3 - "$json_file" <<'EOF_PY'
import json
import sys

try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception:
    sys.exit(1)

for key in data.get("unseal_keys_b64", []):
    if key:
        print(key)
EOF_PY
}

resolve_root_token() {
  if [[ ! -f "$VAULT_INIT_OUTPUT" ]]; then
    return 1
  fi

  extract_root_token_from_json "$VAULT_INIT_OUTPUT" 2>/dev/null || true
}

collect_unseal_keys() {
  if [[ ! -f "$VAULT_INIT_OUTPUT" ]]; then
    return 1
  fi

  extract_unseal_keys_from_json "$VAULT_INIT_OUTPUT" 2>/dev/null || true
}

initialize_and_unseal_vault() {
  log "Step 4/9: Vault init/unseal"

  wait_for_vault_pod_running

  if ! vault_is_initialized; then
    if [[ "$MODE" != "init" ]]; then
      die "vault is not initialized in reboot mode"
    fi

    mkdir -p "$(dirname "$VAULT_INIT_OUTPUT")"
    umask 077

    local init_json
    local init_rc
    set +e
    init_json="$(vault_exec vault operator init -format=json 2>&1)"
    init_rc=$?
    set -e

    if [[ "$init_rc" -ne 0 ]]; then
      die "vault init failed: ${init_json}"
    fi

    printf '%s\n' "$init_json" >"$VAULT_INIT_OUTPUT"
    chmod 600 "$VAULT_INIT_OUTPUT"
    ok "vault init complete and saved: ${VAULT_INIT_OUTPUT}"
  else
    ok "vault already initialized"
  fi

  if vault_is_sealed; then
    local keys=()
    local key

    while IFS= read -r key; do
      key="$(trim "$key")"
      [[ -z "$key" ]] && continue
      keys+=("$key")
    done < <(collect_unseal_keys || true)

    if [[ ${#keys[@]} -eq 0 ]]; then
      die "vault is sealed and no unseal keys found in ${VAULT_INIT_OUTPUT}"
    fi

    for key in "${keys[@]}"; do
      if ! vault_is_sealed; then
        break
      fi
      vault_exec vault operator unseal "$key" >/dev/null 2>&1 || true
    done

    if vault_is_sealed; then
      die "vault is still sealed after unseal attempts"
    fi

    ok "vault unsealed"
  else
    ok "vault already unsealed"
  fi
}

configure_vault_for_eso() {
  log "Step 5/9: Vault auth/policy/role bootstrap"

  local token
  token="$(resolve_root_token || true)"
  if [[ -z "$token" ]]; then
    if [[ "$MODE" == "init" ]]; then
      die "cannot read Vault root token from ${VAULT_INIT_OUTPUT}"
    fi
    warn "root token unavailable; skipping Vault policy/role configuration"
    return
  fi

  local auth_list
  auth_list="$(vault_exec_token "$token" vault auth list -format=json 2>/dev/null || true)"
  if [[ "$auth_list" != *'"kubernetes/"'* ]]; then
    vault_exec_token "$token" vault auth enable kubernetes >/dev/null
  fi

  vault_exec_token "$token" vault write auth/kubernetes/config \
    kubernetes_host='https://kubernetes.default.svc:443' \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token >/dev/null
  ok "vault kubernetes auth configured"

  local secrets_list
  secrets_list="$(vault_exec_token "$token" vault secrets list -format=json 2>/dev/null || true)"
  if [[ "$secrets_list" != *'"kv/"'* ]]; then
    vault_exec_token "$token" vault secrets enable -path=kv kv-v2 >/dev/null
  fi

  local audit_list
  audit_list="$(vault_exec_token "$token" vault audit list -format=json 2>/dev/null || true)"
  if [[ "$audit_list" != *'"file/"'* ]]; then
    vault_exec_token "$token" vault audit enable file file_path=/vault/audit/audit.log >/dev/null
  fi
  ok "vault kv/audit configured"

  local spec policy prefix role ns role_policy
  for spec in "${VAULT_POLICY_SPECS[@]}"; do
    IFS='|' read -r policy prefix <<< "$spec"
    cat <<EOF_POLICY | vault_exec_token "$token" vault policy write "$policy" - >/dev/null
path "kv/data/${prefix}/*" {
  capabilities = ["read"]
}
EOF_POLICY
    ok "vault policy applied: ${policy}"
  done

  for spec in "${VAULT_ROLE_SPECS[@]}"; do
    IFS='|' read -r role ns role_policy <<< "$spec"
    vault_exec_token "$token" vault write "auth/kubernetes/role/${role}" \
      bound_service_account_names=eso-vault \
      bound_service_account_namespaces="$ns" \
      policies="$role_policy" \
      audience=vault \
      ttl=1h >/dev/null
    ok "vault role applied: ${role}"
  done
}

env_file_has_key() {
  local env_file="$1"
  local expected_key="$2"
  local raw line key

  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="$(trim "$raw")"
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue
    if [[ "${line#export }" != "$line" ]]; then
      line="${line#export }"
    fi
    [[ "$line" != *=* ]] && continue

    key="$(trim "${line%%=*}")"
    if [[ "$key" == "$expected_key" ]]; then
      return 0
    fi
  done < "$env_file"

  return 1
}

list_env_keys() {
  local env_file="$1"
  local raw line key

  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="$(trim "$raw")"
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue
    if [[ "${line#export }" != "$line" ]]; then
      line="${line#export }"
    fi
    [[ "$line" != *=* ]] && continue

    key="$(trim "${line%%=*}")"
    [[ -z "$key" ]] && continue
    printf '%s\n' "$key"
  done < "$env_file"
}

normalize_env_value() {
  local value="$1"
  value="$(trim "$value")"
  if [[ ${#value} -ge 2 ]]; then
    local first_char="${value:0:1}"
    local last_char="${value:${#value}-1:1}"
    if [[ "$first_char" == '"' && "$last_char" == '"' ]]; then
      value="${value:1:${#value}-2}"
      # Decode escaped sequences from double-quoted values (\n, \r, \t, \", \\ ...).
      value="$(printf '%b' "$value")"
    elif [[ "$first_char" == "'" && "$last_char" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi
  printf '%s' "$value"
}

validate_seed_directory_layout() {
  [[ -d "$VAULT_SECRETS_DIR" ]] || die "vault secrets dir not found: $VAULT_SECRETS_DIR"

  local rel_path env_file schema_file schema_key schema_has_keys
  for rel_path in "${REQUIRED_SEED_FILES[@]}"; do
    env_file="${VAULT_SECRETS_DIR}/${rel_path}"
    schema_file="${env_file}.example"

    if [[ ! -f "$env_file" ]]; then
      die "missing required seed file: ${env_file}"
    fi
    if [[ ! -f "$schema_file" ]]; then
      die "missing required seed schema file: ${schema_file}"
    fi

    schema_has_keys="false"
    while IFS= read -r schema_key; do
      schema_key="$(trim "$schema_key")"
      [[ -z "$schema_key" ]] && continue
      schema_has_keys="true"
      if ! env_file_has_key "$env_file" "$schema_key"; then
        die "missing key '${schema_key}' in ${env_file} (schema: ${schema_file})"
      fi
    done < <(list_env_keys "$schema_file")

    if [[ "$schema_has_keys" != "true" ]]; then
      die "no keys found in seed schema file: ${schema_file}"
    fi
  done

  ok "vault seed directory layout validated"
}

put_vault_kv_from_env_file() {
  local token="$1"
  local kv_path="$2"
  local env_file="$3"

  local kv_pairs=()
  local raw line key value

  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="$(trim "$raw")"
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue
    if [[ "${line#export }" != "$line" ]]; then
      line="${line#export }"
    fi
    [[ "$line" != *=* ]] && continue

    key="$(trim "${line%%=*}")"
    value="${line#*=}"
    [[ -z "$key" ]] && continue

    value="$(normalize_env_value "$value")"

    kv_pairs+=("${key}=${value}")
  done < "$env_file"

  if [[ ${#kv_pairs[@]} -eq 0 ]]; then
    die "no key/value found in ${env_file}"
  fi

  vault_exec_token "$token" vault kv put "kv/${kv_path}" "${kv_pairs[@]}" >/dev/null
  ok "seeded vault kv: kv/${kv_path}"
}

seed_vault_secrets_from_dir() {
  log "Step 6/9: Vault secret seeding"

  [[ "$MODE" == "init" ]] || {
    ok "reboot mode: skip vault secret seeding"
    return
  }

  validate_seed_directory_layout

  local token
  token="$(resolve_root_token || true)"
  [[ -n "$token" ]] || die "cannot seed vault secrets without root token"

  local env_files
  env_files="$(find "$VAULT_SECRETS_DIR" -type f -name '*.env' | sort || true)"
  [[ -n "$env_files" ]] || die "no .env files found in ${VAULT_SECRETS_DIR}"

  local env_file rel_path kv_path
  while IFS= read -r env_file; do
    [[ -z "$env_file" ]] && continue
    rel_path="${env_file#${VAULT_SECRETS_DIR}/}"
    kv_path="${rel_path%.env}"
    put_vault_kv_from_env_file "$token" "$kv_path" "$env_file"
  done <<< "$env_files"
}

force_reconcile_resource() {
  local resource="$1"
  local stamp
  stamp="$(date +%s)"

  local lines ns name
  lines="$(k get "$resource" -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
  [[ -n "$lines" ]] || return

  while IFS=$'\t' read -r ns name; do
    [[ -z "$ns" || -z "$name" ]] && continue
    k -n "$ns" annotate "$resource" "$name" litomi.dev/reconcile-ts="$stamp" --overwrite >/dev/null 2>&1 || true
  done <<< "$lines"
}

force_refresh_argocd_apps() {
  local apps app
  apps="$(k -n argocd get applications.argoproj.io -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
  [[ -n "$apps" ]] || return

  while IFS= read -r app; do
    [[ -z "$app" ]] && continue
    k -n argocd annotate applications.argoproj.io "$app" argocd.argoproj.io/refresh=hard --overwrite >/dev/null 2>&1 || true
  done <<< "$apps"
}

run_reconcile_actions() {
  log "Step 7/9: reconcile"
  force_reconcile_resource secretstores.external-secrets.io
  force_reconcile_resource externalsecrets.external-secrets.io
  force_refresh_argocd_apps
  ok "reconcile annotations applied"
}

wait_for_argocd_apps_healthy() {
  local waited=0
  local lines name sync health

  while (( waited < BOOT_WAIT_SECONDS )); do
    lines="$(k -n argocd get applications.argoproj.io -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.sync.status}{"\t"}{.status.health.status}{"\n"}{end}' 2>/dev/null || true)"

    if [[ -n "${lines//[$'\n\r\t ']}" ]]; then
      local all_ok="true"
      while IFS=$'\t' read -r name sync health; do
        [[ -z "$name" ]] && continue
        if [[ "$sync" != "Synced" || "$health" != "Healthy" ]]; then
          all_ok="false"
          break
        fi
      done <<< "$lines"

      if [[ "$all_ok" == "true" ]]; then
        ok "all Argo CD apps are Synced/Healthy"
        return
      fi
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  k -n argocd get applications.argoproj.io \
    -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status' || true
  die "Argo CD apps did not converge within ${BOOT_WAIT_SECONDS}s"
}

wait_for_secretstores_ready() {
  local waited=0
  local ns ready all_ready

  while (( waited < BOOT_WAIT_SECONDS )); do
    all_ready="true"

    for ns in "${VAULT_CA_NAMESPACES[@]}"; do
      if ! namespace_exists "$ns"; then
        all_ready="false"
        break
      fi

      if ! resource_exists "$ns" secretstores.external-secrets.io vault; then
        all_ready="false"
        break
      fi

      ready="$(k -n "$ns" get secretstores.external-secrets.io/vault -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status}{end}' 2>/dev/null || true)"
      if [[ "$ready" != "True" ]]; then
        all_ready="false"
        break
      fi
    done

    if [[ "$all_ready" == "true" ]]; then
      ok "all Vault SecretStores are Ready=True"
      return
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  die "Vault SecretStores did not reach Ready=True within ${BOOT_WAIT_SECONDS}s"
}

wait_for_required_cluster_secrets() {
  local waited=0
  local spec ns name missing

  while (( waited < BOOT_WAIT_SECONDS )); do
    missing=""

    for spec in "${REQUIRED_CLUSTER_SECRETS[@]}"; do
      IFS='|' read -r ns name <<< "$spec"
      if ! resource_exists "$ns" secret "$name"; then
        missing+=" ${ns}/${name}"
      fi
    done

    if [[ -z "$missing" ]]; then
      ok "all required Kubernetes secrets exist"
      return
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  die "required Kubernetes secrets missing:${missing}"
}

check_vault_runtime_health() {
  if ! vault_is_initialized; then
    die "vault is not initialized"
  fi
  if vault_is_sealed; then
    die "vault is sealed"
  fi
  ok "vault runtime health is good"
}

check_public_urls() {
  if [[ "$SKIP_PUBLIC_CHECK" == "true" ]]; then
    warn "public url checks skipped"
    return
  fi

  local url tmp_file code
  IFS=',' read -r -a urls <<< "$PUBLIC_URLS"

  for url in "${urls[@]}"; do
    url="$(trim "$url")"
    [[ -z "$url" ]] && continue

    tmp_file="$(mktemp)"
    code="$(curl -kLsS --max-time 20 -o "$tmp_file" -w '%{http_code}' "$url" || true)"

    if [[ -z "$code" || "$code" == "000" ]]; then
      rm -f "$tmp_file"
      die "public check failed (no response): $url"
    fi
    if grep -q 'Error 1033' "$tmp_file"; then
      rm -f "$tmp_file"
      die "public check failed (Cloudflare 1033): $url"
    fi
    if (( code < 200 || code >= 400 )); then
      rm -f "$tmp_file"
      die "public check failed (http=${code}): $url"
    fi

    rm -f "$tmp_file"
    ok "public check ok: $url (http=${code})"
  done
}

install_or_update_reboot_service() {
  log "Step 9/9: install reboot service"

  if [[ "$MODE" != "init" ]]; then
    ok "reboot mode: skip reboot service install"
    return
  fi

  assert_command_exists systemctl

  local tmp_file
  tmp_file="$(mktemp)"
  cat >"$tmp_file" <<EOF_SERVICE
[Unit]
Description=Litomi platform reboot reconciliation
Wants=network-online.target
After=network-online.target k3s.service

[Service]
Type=oneshot
User=root
WorkingDirectory=${REPO_ROOT}
Environment="KUBECTL_CMD=kubectl"
Environment="VAULT_INIT_OUTPUT=${VAULT_INIT_OUTPUT}"
Environment="VAULT_ADDR=${VAULT_ADDR}"
Environment="VAULT_CACERT=${VAULT_CACERT}"
ExecStart=${SCRIPT_PATH} --mode reboot --skip-public-check
TimeoutStartSec=1800
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF_SERVICE

  run_root install -m 644 "$tmp_file" "$SERVICE_UNIT_PATH"
  rm -f "$tmp_file"

  run_root systemctl daemon-reload
  run_root systemctl enable "$SERVICE_NAME"
  run_root systemctl restart "$SERVICE_NAME"

  ok "reboot service installed/enabled: ${SERVICE_NAME}"
}

print_snapshot() {
  log "snapshot"
  k get nodes -o wide || true
  k -n argocd get applications.argoproj.io \
    -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status' || true
  k -n "$VAULT_NAMESPACE" get pods,svc,secret 2>/dev/null || true
}

main() {
  parse_args "$@"

  ensure_host_dependencies

  log "Mode: ${MODE}"
  log "Vault init output: ${VAULT_INIT_OUTPUT}"
  if [[ "$MODE" == "init" ]]; then
    log "Vault secrets dir: ${VAULT_SECRETS_DIR}"
  fi

  ensure_k3s_if_needed
  ensure_argocd_bootstrap_and_control_plane
  ensure_vault_tls_assets
  initialize_and_unseal_vault
  configure_vault_for_eso
  seed_vault_secrets_from_dir
  run_reconcile_actions

  log "Step 8/9: platform checks"
  wait_for_argocd_apps_healthy
  wait_for_secretstores_ready
  wait_for_required_cluster_secrets
  check_vault_runtime_health
  check_public_urls

  install_or_update_reboot_service
  print_snapshot

  print_summary "PASS" "platform bootstrap complete"
}

main "$@"
