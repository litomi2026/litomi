#!/usr/bin/env bash

set -euo pipefail

SCRIPT_PATH="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/$(basename -- "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

KUBECTL_CMD="${KUBECTL_CMD:-sudo kubectl}"
read -r -a KUBECTL_ARR <<< "${KUBECTL_CMD}"

BOOT_WAIT_SECONDS="${BOOT_WAIT_SECONDS:-900}"
CHECK_INTERVAL_SECONDS="${CHECK_INTERVAL_SECONDS:-5}"
PUBLIC_URLS="${PUBLIC_URLS:-https://argocd.litomi.in/,https://litomi.in/,https://api.litomi.in/health}"

VAULT_NAMESPACE="${VAULT_NAMESPACE:-vault}"
VAULT_POD="${VAULT_POD:-vault-0}"
VAULT_ADDR="${VAULT_ADDR:-https://vault.vault.svc:8200}"
VAULT_CACERT="${VAULT_CACERT:-/vault/userconfig/vault-tls/ca.crt}"
VAULT_TLS_DIR="${VAULT_TLS_DIR:-$HOME/vault-tls}"
VAULT_INIT_OUTPUT="${VAULT_INIT_OUTPUT:-${VAULT_TLS_DIR}/vault-init.json}"
VAULT_TLS_FORCE_REGENERATE="${VAULT_TLS_FORCE_REGENERATE:-false}"
VAULT_UNSEAL_KEYS="${VAULT_UNSEAL_KEYS:-}"
VAULT_UNSEAL_KEYS_FILE="${VAULT_UNSEAL_KEYS_FILE:-}"
VAULT_ROOT_TOKEN="${VAULT_ROOT_TOKEN:-}"
VAULT_ROOT_TOKEN_FILE="${VAULT_ROOT_TOKEN_FILE:-}"
VAULT_SECRETS_DIR="${VAULT_SECRETS_DIR:-}"

SERVICE_NAME="litomi-platform-reboot.service"
SERVICE_UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}"
SERVICE_SCRIPT_PATH="${SERVICE_SCRIPT_PATH:-/usr/local/bin/platform-ops.sh}"
SERVICE_KUBECTL_CMD="${SERVICE_KUBECTL_CMD:-kubectl}"
SERVICE_BOOT_WAIT_SECONDS="${SERVICE_BOOT_WAIT_SECONDS:-900}"
SERVICE_CHECK_INTERVAL_SECONDS="${SERVICE_CHECK_INTERVAL_SECONDS:-5}"
SERVICE_TIMEOUT_START_SEC="${SERVICE_TIMEOUT_START_SEC:-1800}"
REBOOT_SERVICE_LOG_LINES="${REBOOT_SERVICE_LOG_LINES:-200}"

CHECK_ONLY="false"
REBOOT_MODE="false"
NON_INTERACTIVE="false"
SKIP_PUBLIC_CHECK="false"
SKIP_K3S_INSTALL="false"
SKIP_GITOPS_APPLY="false"
SKIP_VAULT_BOOTSTRAP="false"
INSTALL_REBOOT_SERVICE="false"
REMOVE_REBOOT_SERVICE="false"
SHOW_REBOOT_SERVICE_STATUS="false"
SHOW_REBOOT_SERVICE_LOGS="false"

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

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

EXPECTED_SECRET_SPECS=(
  "litomi-prod|litomi-backend-secret"
  "litomi-prod|litomi-backend-file"
  "litomi-stg|litomi-backend-secret"
  "litomi-stg|litomi-backend-file"
  "cloudflared|cloudflared-token"
  "monitoring|grafana-admin"
  "monitoring|alertmanager-discord-webhook-warning"
  "monitoring|alertmanager-discord-webhook-critical"
  "velero|velero-cloud-credentials"
  "logging|loki-minio"
  "tracing|tempo-minio"
)

usage() {
  cat <<'EOF'
Usage:
  ./k8s/platform-ops.sh [options]

Default behavior:
  Clean-install oriented full flow:
  k3s install/check -> Argo CD bootstrap -> root app apply -> Vault/ESO bootstrap ->
  reconcile -> platform checks (Argo/ESO/Velero/Observability/public URLs)

Common options:
  --check-only                     Check-only mode (no apply/write/reconcile actions)
  --reboot-mode                    Reboot validation mode (skip install/bootstrap actions)
  --non-interactive                Do not prompt; fail/warn when manual input is required
  --skip-public-check              Skip external URL checks
  --skip-k3s-install               Skip k3s installation attempt
  --skip-gitops-apply              Skip Argo bootstrap/root apply
  --skip-vault-bootstrap           Skip Vault TLS/init/config/bootstrap actions
  --public-urls <csv>              Override PUBLIC_URLS (comma-separated)

Vault inputs:
  --vault-init-output <path>       Path to store/read Vault init json output
  --vault-unseal-keys <csv>        Comma-separated unseal keys
  --vault-unseal-keys-file <path>  File with unseal keys (or init json)
  --vault-root-token <token>       Root token for Vault config/kv put
  --vault-root-token-file <path>   File containing root token (or init json)
  --vault-secrets-dir <dir>        Auto-seed directory (.env files mapped to kv paths)

Reboot service helpers:
  --install-reboot-service         Install+enable+start systemd service
  --remove-reboot-service          Disable/remove systemd service
  --show-reboot-service-status     Show systemd service status and exit
  --show-reboot-service-logs       Show service logs and exit
  --reboot-service-log-lines <n>   Lines for --show-reboot-service-logs (default: 200)

Other:
  -h, --help                       Show help
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '  [PASS] %s\n' "$*"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  printf '  [WARN] %s\n' "$*"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf '  [FAIL] %s\n' "$*"
}

run() {
  log "+ $*"
  "$@"
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
  if [[ ! -f "$path" ]]; then
    printf 'Missing file: %s\n' "$path" >&2
    exit 1
  fi
}

assert_command_exists() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'Missing command: %s\n' "$cmd" >&2
    exit 1
  fi
}

require_python3_for_json() {
  if ! command -v python3 >/dev/null 2>&1; then
    printf 'python3 is required to parse Vault init json files.\n' >&2
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --check-only)
        CHECK_ONLY="true"
        shift
        ;;
      --reboot-mode)
        REBOOT_MODE="true"
        shift
        ;;
      --non-interactive)
        NON_INTERACTIVE="true"
        shift
        ;;
      --skip-public-check)
        SKIP_PUBLIC_CHECK="true"
        shift
        ;;
      --skip-k3s-install)
        SKIP_K3S_INSTALL="true"
        shift
        ;;
      --skip-gitops-apply)
        SKIP_GITOPS_APPLY="true"
        shift
        ;;
      --skip-vault-bootstrap)
        SKIP_VAULT_BOOTSTRAP="true"
        shift
        ;;
      --public-urls)
        PUBLIC_URLS="${2:-}"
        shift 2
        ;;
      --vault-init-output)
        VAULT_INIT_OUTPUT="${2:-}"
        shift 2
        ;;
      --vault-unseal-keys)
        VAULT_UNSEAL_KEYS="${2:-}"
        shift 2
        ;;
      --vault-unseal-keys-file)
        VAULT_UNSEAL_KEYS_FILE="${2:-}"
        shift 2
        ;;
      --vault-root-token)
        VAULT_ROOT_TOKEN="${2:-}"
        shift 2
        ;;
      --vault-root-token-file)
        VAULT_ROOT_TOKEN_FILE="${2:-}"
        shift 2
        ;;
      --vault-secrets-dir)
        VAULT_SECRETS_DIR="${2:-}"
        shift 2
        ;;
      --install-reboot-service)
        INSTALL_REBOOT_SERVICE="true"
        shift
        ;;
      --remove-reboot-service)
        REMOVE_REBOOT_SERVICE="true"
        shift
        ;;
      --show-reboot-service-status)
        SHOW_REBOOT_SERVICE_STATUS="true"
        shift
        ;;
      --show-reboot-service-logs)
        SHOW_REBOOT_SERVICE_LOGS="true"
        shift
        ;;
      --reboot-service-log-lines)
        REBOOT_SERVICE_LOG_LINES="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        printf 'Unknown argument: %s\n\n' "$1" >&2
        usage
        exit 1
        ;;
    esac
  done

  if [[ "$REBOOT_MODE" == "true" ]]; then
    SKIP_K3S_INSTALL="true"
    SKIP_GITOPS_APPLY="true"
    SKIP_VAULT_BOOTSTRAP="true"
  fi
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
    if k get --raw='/readyz' >/tmp/litomi-readyz.txt 2>/dev/null && grep -q "ok" /tmp/litomi-readyz.txt; then
      return 0
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done
  return 1
}

ensure_k3s_if_needed() {
  log "Step 1/8: k3s install/check"

  if k get nodes >/dev/null 2>&1; then
    pass "kubernetes api already reachable; skip k3s install"
  else
    if [[ "$SKIP_K3S_INSTALL" == "true" ]]; then
      fail "kubernetes api unreachable and --skip-k3s-install set"
      exit 1
    fi
    if [[ "$CHECK_ONLY" == "true" ]]; then
      fail "kubernetes api unreachable in --check-only mode"
      exit 1
    fi

    run bash -c 'curl -sfL https://get.k3s.io | sudo sh -s - server --cluster-init --secrets-encryption'
    pass "k3s install command completed"
  fi

  if wait_for_api_ready; then
    pass "kubernetes api ready"
  else
    fail "kubernetes api not ready within ${BOOT_WAIT_SECONDS}s"
    exit 1
  fi

  if k wait --for=condition=Ready node --all --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
    pass "all nodes ready"
  else
    fail "node readiness check failed"
  fi

  if k -n kube-system wait --for=condition=Available deployment --all --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
    pass "kube-system deployments available"
  else
    fail "kube-system deployment availability check failed"
  fi

  run k get nodes -o wide
  run k get --raw='/readyz?verbose'

  if [[ "$CHECK_ONLY" != "true" ]]; then
    run sudo timeout 60s sh -c 'until k3s secrets-encrypt status >/dev/null 2>&1; do sleep 2; done'
    run sudo k3s secrets-encrypt status
    run sudo k3s etcd-snapshot save --name "bootstrap-$(date +%Y%m%d-%H%M%S)"
    run sudo k3s etcd-snapshot ls
    pass "etcd snapshot created"
  else
    warn "skip etcd snapshot in --check-only mode"
  fi
}

ensure_argocd_and_root() {
  log "Step 2/8: Argo CD bootstrap/root app"

  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/argocd/kustomization.yaml"
  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"

  if [[ "$SKIP_GITOPS_APPLY" != "true" && "$CHECK_ONLY" != "true" ]]; then
    run k apply --server-side --force-conflicts -k "${REPO_ROOT}/k8s/bootstrap/argocd"
    run k apply -f "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"
  else
    warn "skip Argo CD/root apply (skip flag or check-only)"
  fi

  if resource_exists argocd deployment argocd-repo-server; then
    if k -n argocd rollout status deployment/argocd-repo-server --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
      pass "argocd-repo-server ready"
    else
      fail "argocd-repo-server unready"
    fi
  else
    fail "missing deployment: argocd/argocd-repo-server"
  fi

  if resource_exists argocd statefulset argocd-application-controller; then
    if k -n argocd rollout status statefulset/argocd-application-controller --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
      pass "argocd-application-controller ready"
    else
      fail "argocd-application-controller unready"
    fi
  else
    fail "missing statefulset: argocd/argocd-application-controller"
  fi

  if resource_exists argocd secret argocd-initial-admin-secret; then
    pass "argocd-initial-admin-secret exists"
    if [[ "$CHECK_ONLY" != "true" ]]; then
      log "Argo CD initial admin password:"
      k -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d || true
      printf '\n'
    fi
  else
    warn "argocd-initial-admin-secret not found yet"
  fi

  if resource_exists argocd applications.argoproj.io root; then
    if [[ "$CHECK_ONLY" != "true" ]]; then
      k -n argocd wait --for=jsonpath='{.status.sync.status}'=Synced applications.argoproj.io/root --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1 || true
      k -n argocd wait --for=jsonpath='{.status.health.status}'=Healthy applications.argoproj.io/root --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1 || true
    fi

    local sync
    local health
    sync="$(k -n argocd get applications.argoproj.io/root -o jsonpath='{.status.sync.status}' 2>/dev/null || true)"
    health="$(k -n argocd get applications.argoproj.io/root -o jsonpath='{.status.health.status}' 2>/dev/null || true)"
    if [[ "$sync" == "Synced" && "$health" == "Healthy" ]]; then
      pass "root app is Synced/Healthy"
    else
      fail "root app status: sync=${sync:-<empty>}, health=${health:-<empty>}"
    fi
  else
    fail "missing argocd app: root"
  fi
}

vault_exec() {
  k -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" "$@"
}

vault_exec_token() {
  local token="$1"
  shift
  k -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" VAULT_TOKEN="$token" "$@"
}

vault_status_output() {
  # Try JSON first; when unavailable/failing (e.g. during restart), fall back to plain output.
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

should_manage_vault_tls_assets() {
  if [[ "$VAULT_TLS_FORCE_REGENERATE" == "true" ]]; then
    return 0
  fi
  if resource_exists "$VAULT_NAMESPACE" secret vault-tls; then
    return 1
  fi
  return 0
}

generate_vault_tls_files() {
  assert_command_exists openssl
  mkdir -p "$VAULT_TLS_DIR"

  local ca_key="${VAULT_TLS_DIR}/ca.key"
  local ca_crt="${VAULT_TLS_DIR}/ca.crt"
  local tls_key="${VAULT_TLS_DIR}/tls.key"
  local tls_csr="${VAULT_TLS_DIR}/tls.csr"
  local tls_crt="${VAULT_TLS_DIR}/tls.crt"
  local server_cnf="${VAULT_TLS_DIR}/server.cnf"

  if [[ "$VAULT_TLS_FORCE_REGENERATE" != "true" && -f "$ca_crt" && -f "$tls_crt" && -f "$tls_key" ]]; then
    pass "vault TLS files already exist in ${VAULT_TLS_DIR}"
    return
  fi

  run openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -subj "/CN=litomi-vault-ca" \
    -keyout "$ca_key" -out "$ca_crt"

  cat >"$server_cnf" <<'EOF'
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
EOF

  run openssl req -new -newkey rsa:4096 -nodes -sha256 \
    -keyout "$tls_key" -out "$tls_csr" -config "$server_cnf"

  run openssl x509 -req -sha256 -days 825 \
    -in "$tls_csr" -CA "$ca_crt" -CAkey "$ca_key" -CAcreateserial \
    -out "$tls_crt" -extensions req_ext -extfile "$server_cnf"

  pass "generated vault TLS cert/key"
}

apply_vault_tls_and_ca() {
  local ca_crt="${VAULT_TLS_DIR}/ca.crt"
  local tls_crt="${VAULT_TLS_DIR}/tls.crt"
  local tls_key="${VAULT_TLS_DIR}/tls.key"

  assert_file_exists "$ca_crt"
  assert_file_exists "$tls_crt"
  assert_file_exists "$tls_key"

  if ! namespace_exists "$VAULT_NAMESPACE"; then
    run k create namespace "$VAULT_NAMESPACE"
  fi

  k -n "$VAULT_NAMESPACE" create secret generic vault-tls \
    --from-file=tls.crt="$tls_crt" \
    --from-file=tls.key="$tls_key" \
    --from-file=ca.crt="$ca_crt" \
    --dry-run=client -o yaml | k apply -f -
  pass "applied secret: ${VAULT_NAMESPACE}/vault-tls"

  local ns
  for ns in "${VAULT_CA_NAMESPACES[@]}"; do
    if ! namespace_exists "$ns"; then
      warn "namespace not found for vault-ca configmap: ${ns}"
      continue
    fi
    k -n "$ns" create configmap vault-ca \
      --from-file=ca.crt="$ca_crt" \
      --dry-run=client -o yaml | k apply -f -
    pass "applied configmap: ${ns}/vault-ca"
  done
}

extract_root_token_from_json() {
  local json_file="$1"
  require_python3_for_json
  python3 - "$json_file" <<'PY'
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
PY
}

extract_unseal_keys_from_json() {
  local json_file="$1"
  require_python3_for_json
  python3 - "$json_file" <<'PY'
import json
import sys

try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception:
    sys.exit(1)

for k in data.get("unseal_keys_b64", []):
    if k:
        print(k)
PY
}

resolve_root_token() {
  if [[ -n "$VAULT_ROOT_TOKEN" ]]; then
    printf '%s' "$VAULT_ROOT_TOKEN"
    return 0
  fi

  local file_candidate=""
  if [[ -n "$VAULT_ROOT_TOKEN_FILE" ]]; then
    file_candidate="$VAULT_ROOT_TOKEN_FILE"
  elif [[ -f "$VAULT_INIT_OUTPUT" ]]; then
    file_candidate="$VAULT_INIT_OUTPUT"
  fi

  if [[ -n "$file_candidate" && -f "$file_candidate" ]]; then
    if [[ "$file_candidate" == *.json ]]; then
      extract_root_token_from_json "$file_candidate" 2>/dev/null || true
      return 0
    fi

    while IFS= read -r line || [[ -n "$line" ]]; do
      line="$(trim "$line")"
      [[ -z "$line" ]] && continue
      [[ "${line:0:1}" == "#" ]] && continue
      printf '%s' "$line"
      return 0
    done < "$file_candidate"
  fi

  if [[ "$NON_INTERACTIVE" != "true" ]]; then
    local input=""
    read -r -s -p "Vault root token: " input
    printf '\n'
    printf '%s' "$input"
  fi
}

collect_unseal_keys() {
  local keys=()
  local raw
  local key

  if [[ -n "$VAULT_UNSEAL_KEYS" ]]; then
    IFS=',' read -r -a raw_arr <<< "$VAULT_UNSEAL_KEYS"
    for raw in "${raw_arr[@]}"; do
      key="$(trim "$raw")"
      [[ -z "$key" ]] && continue
      keys+=("$key")
    done
  fi

  local file_candidate=""
  if [[ ${#keys[@]} -eq 0 ]]; then
    if [[ -n "$VAULT_UNSEAL_KEYS_FILE" ]]; then
      file_candidate="$VAULT_UNSEAL_KEYS_FILE"
    elif [[ -f "$VAULT_INIT_OUTPUT" ]]; then
      file_candidate="$VAULT_INIT_OUTPUT"
    fi
  fi

  if [[ ${#keys[@]} -eq 0 && -n "$file_candidate" && -f "$file_candidate" ]]; then
    if [[ "$file_candidate" == *.json ]]; then
      while IFS= read -r key; do
        key="$(trim "$key")"
        [[ -z "$key" ]] && continue
        keys+=("$key")
      done < <(extract_unseal_keys_from_json "$file_candidate" 2>/dev/null || true)
    else
      while IFS= read -r raw || [[ -n "$raw" ]]; do
        key="$(trim "$raw")"
        [[ -z "$key" ]] && continue
        [[ "${key:0:1}" == "#" ]] && continue
        keys+=("$key")
      done < "$file_candidate"
    fi
  fi

  if [[ ${#keys[@]} -eq 0 && "$NON_INTERACTIVE" != "true" ]]; then
    local i input
    for i in 1 2 3; do
      input=""
      read -r -s -p "Vault unseal key ${i}: " input
      printf '\n'
      input="$(trim "$input")"
      [[ -z "$input" ]] && continue
      keys+=("$input")
    done
  fi

  printf '%s\n' "${keys[@]}"
}

initialize_and_configure_vault() {
  log "Step 3/8: Vault/ESO bootstrap"

  if [[ "$SKIP_VAULT_BOOTSTRAP" == "true" ]]; then
    warn "skip Vault bootstrap (--skip-vault-bootstrap or --reboot-mode)"
    return
  fi

  if [[ "$CHECK_ONLY" != "true" ]]; then
    if should_manage_vault_tls_assets; then
      generate_vault_tls_files
      apply_vault_tls_and_ca
    else
      pass "existing vault-tls secret detected; skip TLS regenerate/apply (set VAULT_TLS_FORCE_REGENERATE=true to override)"
    fi
  else
    warn "skip Vault TLS apply in --check-only mode"
  fi

  if ! resource_exists "$VAULT_NAMESPACE" pod "$VAULT_POD"; then
    fail "missing Vault pod: ${VAULT_NAMESPACE}/${VAULT_POD}"
    return
  fi
  if k -n "$VAULT_NAMESPACE" wait --for=jsonpath='{.status.phase}'=Running "pod/${VAULT_POD}" --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
    pass "vault pod running: ${VAULT_NAMESPACE}/${VAULT_POD}"
  else
    fail "vault pod not running: ${VAULT_NAMESPACE}/${VAULT_POD}"
    return
  fi

  if ! vault_is_initialized; then
    if [[ "$CHECK_ONLY" == "true" ]]; then
      fail "vault not initialized (check-only)"
      return
    fi

    mkdir -p "$(dirname "$VAULT_INIT_OUTPUT")"
    umask 077
    local init_json
    local init_rc
    set +e
    init_json="$(vault_exec vault operator init -format=json 2>&1)"
    init_rc=$?
    set -e

    if [[ "$init_rc" -eq 0 ]]; then
      printf '%s\n' "$init_json" > "$VAULT_INIT_OUTPUT"
      chmod 600 "$VAULT_INIT_OUTPUT"
      pass "vault initialized and output saved: ${VAULT_INIT_OUTPUT}"
    elif printf '%s\n' "$init_json" | grep -qi "already initialized"; then
      pass "vault already initialized"
    else
      fail "vault init failed: ${init_json}"
      return
    fi
  else
    pass "vault already initialized"
  fi

  if vault_is_sealed; then
    local keys=()
    local key
    while IFS= read -r key; do
      [[ -z "$key" ]] && continue
      keys+=("$key")
    done < <(collect_unseal_keys)

    if [[ ${#keys[@]} -eq 0 ]]; then
      fail "vault is sealed and no unseal keys provided"
      return
    fi

    for key in "${keys[@]}"; do
      if ! vault_is_sealed; then
        break
      fi
      vault_exec vault operator unseal "$key" >/dev/null 2>&1 || true
    done

    if vault_is_sealed; then
      fail "vault still sealed after unseal attempts"
      return
    fi
    pass "vault unsealed"
  else
    pass "vault already unsealed"
  fi

  if [[ "$CHECK_ONLY" == "true" ]]; then
    return
  fi

  local token
  token="$(resolve_root_token || true)"
  if [[ -z "$token" ]]; then
    warn "vault root token missing; skip Vault config and secret seeding"
    return
  fi

  local auth_list
  auth_list="$(vault_exec_token "$token" vault auth list -format=json 2>/dev/null || true)"
  if [[ "$auth_list" != *'"kubernetes/"'* ]]; then
    run vault_exec_token "$token" vault auth enable kubernetes
  fi

  run vault_exec_token "$token" vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

  local secrets_list
  secrets_list="$(vault_exec_token "$token" vault secrets list -format=json 2>/dev/null || true)"
  if [[ "$secrets_list" != *'"kv/"'* ]]; then
    run vault_exec_token "$token" vault secrets enable -path=kv kv-v2
  fi

  local audit_list
  audit_list="$(vault_exec_token "$token" vault audit list -format=json 2>/dev/null || true)"
  if [[ "$audit_list" != *'"file/"'* ]]; then
    run vault_exec_token "$token" vault audit enable file file_path=/vault/audit/audit.log
  fi

  local spec policy prefix role ns role_policy
  for spec in "${VAULT_POLICY_SPECS[@]}"; do
    IFS='|' read -r policy prefix <<< "$spec"
    cat <<EOF | k -n "$VAULT_NAMESPACE" exec -i "$VAULT_POD" -- \
      env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" VAULT_TOKEN="$token" \
      vault policy write "$policy" -
path "kv/data/${prefix}/*" {
  capabilities = ["read"]
}
EOF
    pass "configured Vault policy: ${policy}"
  done

  for spec in "${VAULT_ROLE_SPECS[@]}"; do
    IFS='|' read -r role ns role_policy <<< "$spec"
    run vault_exec_token "$token" vault write "auth/kubernetes/role/${role}" \
      bound_service_account_names=eso-vault \
      bound_service_account_namespaces="$ns" \
      policies="$role_policy" \
      audience=vault \
      ttl=1h
  done
  pass "configured Vault auth roles for ESO namespaces"
}

put_vault_kv_from_env_file() {
  local token="$1"
  local kv_path="$2"
  local env_file="$3"
  local kv_pairs=()
  local raw line key value first_char last_char ref resolved_ref

  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="$(trim "$raw")"
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue
    if [[ "${line#export }" != "$line" ]]; then
      line="${line#export }"
    fi
    if [[ "$line" != *=* ]]; then
      continue
    fi

    key="$(trim "${line%%=*}")"
    value="${line#*=}"
    [[ -z "$key" ]] && continue

    if [[ "${#value}" -ge 2 ]]; then
      first_char="${value:0:1}"
      last_char="${value:${#value}-1:1}"
      if [[ "$first_char" == '"' && "$last_char" == '"' ]]; then
        value="${value:1:${#value}-2}"
      elif [[ "$first_char" == "'" && "$last_char" == "'" ]]; then
        value="${value:1:${#value}-2}"
      fi
    fi

    if [[ "${value:0:1}" == "@" ]]; then
      ref="${value:1}"
      if [[ "$ref" = /* ]]; then
        resolved_ref="$ref"
      else
        resolved_ref="$(cd -- "$(dirname -- "$env_file")" && pwd)/$ref"
      fi
      assert_file_exists "$resolved_ref"
      kv_pairs+=("${key}=@${resolved_ref}")
    else
      kv_pairs+=("${key}=${value}")
    fi
  done < "$env_file"

  if [[ ${#kv_pairs[@]} -eq 0 ]]; then
    warn "no key/value found in ${env_file}"
    return
  fi

  if [[ "$kv_path" == kv/* ]]; then
    run vault_exec_token "$token" vault kv put "$kv_path" "${kv_pairs[@]}"
  else
    run vault_exec_token "$token" vault kv put "kv/${kv_path}" "${kv_pairs[@]}"
  fi
  pass "seeded Vault kv: ${kv_path}"
}

seed_vault_secrets_from_dir() {
  log "Step 4/8: Vault secret seeding"
  if [[ "$CHECK_ONLY" == "true" ]]; then
    warn "skip secret seeding in --check-only mode"
    return
  fi
  if [[ -z "$VAULT_SECRETS_DIR" ]]; then
    warn "VAULT_SECRETS_DIR not provided; skip secret seeding"
    return
  fi
  if [[ ! -d "$VAULT_SECRETS_DIR" ]]; then
    fail "VAULT_SECRETS_DIR not found: ${VAULT_SECRETS_DIR}"
    return
  fi

  local token
  token="$(resolve_root_token || true)"
  if [[ -z "$token" ]]; then
    fail "vault root token missing; cannot seed Vault secrets"
    return
  fi

  local env_files
  env_files="$(find "$VAULT_SECRETS_DIR" -type f -name '*.env' | sort || true)"
  if [[ -z "$env_files" ]]; then
    warn "no .env files found in ${VAULT_SECRETS_DIR}"
    return
  fi

  local env_file rel_path kv_path
  while IFS= read -r env_file; do
    [[ -z "$env_file" ]] && continue
    rel_path="${env_file#${VAULT_SECRETS_DIR}/}"
    kv_path="${rel_path%.env}"
    put_vault_kv_from_env_file "$token" "$kv_path" "$env_file"
  done <<< "$env_files"
}

force_reconcile_all() {
  local resource="$1"
  local stamp list ns name
  stamp="$(date +%s)"
  list="$(
    k get "$resource" -A \
      -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}{end}' 2>/dev/null || true
  )"
  [[ -z "$list" ]] && return
  while IFS=$'\t' read -r ns name; do
    [[ -z "$ns" || -z "$name" ]] && continue
    k -n "$ns" annotate "$resource" "$name" "litomi.dev/platform-ops-reconcile=${stamp}" --overwrite >/dev/null 2>&1 || true
  done <<< "$list"
}

refresh_argocd_apps() {
  local apps app
  apps="$(k -n argocd get applications.argoproj.io -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
  [[ -z "$apps" ]] && return
  while IFS= read -r app; do
    [[ -z "$app" ]] && continue
    k -n argocd annotate applications.argoproj.io "$app" argocd.argoproj.io/refresh=hard --overwrite >/dev/null 2>&1 || true
  done <<< "$apps"
}

run_reconcile_actions() {
  log "Step 5/8: reconcile actions"
  if [[ "$CHECK_ONLY" == "true" ]]; then
    warn "skip reconcile actions in --check-only mode"
    return
  fi
  force_reconcile_all secretstores.external-secrets.io
  force_reconcile_all externalsecrets.external-secrets.io
  refresh_argocd_apps
  pass "triggered reconcile actions (SecretStore/ExternalSecret/Argo CD)"
}

check_argocd_apps() {
  local lines local_fail name sync health
  lines="$(
    k -n argocd get applications.argoproj.io \
      -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.sync.status}{"\t"}{.status.health.status}{"\n"}{end}' 2>/dev/null || true
  )"
  if [[ -z "${lines//[$'\n\r\t ']}" ]]; then
    fail "no Argo CD applications found"
    return
  fi
  local_fail=0
  while IFS=$'\t' read -r name sync health; do
    [[ -z "$name" ]] && continue
    if [[ "$sync" == "Synced" && "$health" == "Healthy" ]]; then
      pass "argocd app healthy: ${name}"
    else
      fail "argocd app unhealthy: ${name} (sync=${sync:-<empty>}, health=${health:-<empty>})"
      local_fail=1
    fi
  done <<< "$lines"
  [[ "$local_fail" -eq 0 ]] || true
}

check_ready_condition_resources() {
  local ns="$1"
  local resource="$2"
  local lines local_fail name ready
  if ! namespace_exists "$ns"; then
    warn "namespace missing: ${ns}"
    return
  fi

  lines="$(
    k -n "$ns" get "$resource" \
      -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .status.conditions[?(@.type=="Ready")]}{.status}{end}{"\n"}{end}' 2>/dev/null || true
  )"
  if [[ -z "${lines//[$'\n\r\t ']}" ]]; then
    warn "no ${resource} resources in ${ns}"
    return
  fi
  local_fail=0
  while IFS=$'\t' read -r name ready; do
    [[ -z "$name" ]] && continue
    if [[ "$ready" == "True" ]]; then
      pass "${resource} Ready=True: ${ns}/${name}"
    else
      fail "${resource} not ready: ${ns}/${name} (Ready=${ready:-<empty>})"
      local_fail=1
    fi
  done <<< "$lines"
  [[ "$local_fail" -eq 0 ]] || true
}

check_secret_exists() {
  local ns="$1"
  local name="$2"
  if resource_exists "$ns" secret "$name"; then
    pass "secret exists: ${ns}/${name}"
  else
    fail "missing secret: ${ns}/${name}"
  fi
}

check_velero() {
  local bsl_lines schedule_count backup_count name phase

  if ! namespace_exists velero; then
    fail "missing namespace: velero"
    return
  fi

  if resource_exists velero deployment velero; then
    if k -n velero rollout status deployment/velero --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
      pass "velero deployment ready"
    else
      fail "velero deployment unready"
    fi
  else
    fail "missing deployment: velero/velero"
  fi

  bsl_lines="$(
    k -n velero get backupstoragelocation \
      -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}' 2>/dev/null || true
  )"
  if [[ -z "${bsl_lines//[$'\n\r\t ']}" ]]; then
    fail "no velero BackupStorageLocation found"
  else
    while IFS=$'\t' read -r name phase; do
      [[ -z "$name" ]] && continue
      if [[ "$phase" == "Available" ]]; then
        pass "velero backup storage available: ${name}"
      else
        fail "velero backup storage unhealthy: ${name} (phase=${phase:-<empty>})"
      fi
    done <<< "$bsl_lines"
  fi

  schedule_count="$(k -n velero get schedule --no-headers 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${schedule_count:-0}" -gt 0 ]]; then
    pass "velero schedules found: ${schedule_count}"
  else
    fail "no velero schedules found"
  fi

  backup_count="$(k -n velero get backup --no-headers 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${backup_count:-0}" -gt 0 ]]; then
    pass "velero backups found: ${backup_count}"
  else
    warn "no velero backups found yet"
  fi
}

check_observability() {
  if ! namespace_exists monitoring; then
    fail "missing namespace: monitoring"
    return
  fi
  if ! namespace_exists logging; then
    fail "missing namespace: logging"
    return
  fi
  if ! namespace_exists tracing; then
    fail "missing namespace: tracing"
    return
  fi

  if resource_exists monitoring deployment blackbox-exporter; then
    if k -n monitoring rollout status deployment/blackbox-exporter --timeout="${BOOT_WAIT_SECONDS}s" >/dev/null 2>&1; then
      pass "blackbox-exporter ready"
    else
      fail "blackbox-exporter unready"
    fi
  else
    fail "missing deployment: monitoring/blackbox-exporter"
  fi

  if resource_exists monitoring probe blackbox-public-endpoints; then
    pass "probe exists: monitoring/blackbox-public-endpoints"
  else
    fail "missing probe: monitoring/blackbox-public-endpoints"
  fi

  if resource_exists monitoring prometheusrule observability-pipeline; then
    pass "prometheusrule exists: monitoring/observability-pipeline"
  else
    fail "missing prometheusrule: monitoring/observability-pipeline"
  fi

  if k -n logging get daemonset -l app.kubernetes.io/instance=fluent-bit >/dev/null 2>&1; then
    local ds_lines ds ready desired
    ds_lines="$(
      k -n logging get daemonset -l app.kubernetes.io/instance=fluent-bit \
        -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.numberReady}{"\t"}{.status.desiredNumberScheduled}{"\n"}{end}' 2>/dev/null || true
    )"
    if [[ -z "${ds_lines//[$'\n\r\t ']}" ]]; then
      fail "no Fluent Bit daemonset found"
    else
      while IFS=$'\t' read -r ds ready desired; do
        [[ -z "$ds" ]] && continue
        if [[ "${ready:-0}" == "${desired:-0}" && "${desired:-0}" != "0" ]]; then
          pass "fluent-bit daemonset ready: ${ready}/${desired}"
        else
          fail "fluent-bit daemonset unready: ${ready:-0}/${desired:-0}"
        fi
      done <<< "$ds_lines"
    fi
  else
    fail "fluent-bit daemonset not found by label"
  fi

  if k -n logging get pods -l app.kubernetes.io/instance=loki --field-selector=status.phase=Running >/dev/null 2>&1; then
    pass "loki running pods found"
  else
    fail "no running loki pods found"
  fi

  if k -n tracing get pods -l app.kubernetes.io/instance=tempo --field-selector=status.phase=Running >/dev/null 2>&1; then
    pass "tempo running pods found"
  else
    fail "no running tempo pods found"
  fi

  if k -n tracing get pods -l app.kubernetes.io/instance=opentelemetry-collector --field-selector=status.phase=Running >/dev/null 2>&1; then
    pass "opentelemetry-collector running pods found"
  else
    fail "no running opentelemetry-collector pods found"
  fi
}

check_public_url() {
  local url="$1"
  local tmp_file code
  tmp_file="$(mktemp)"
  code="$(curl -kLsS --max-time 20 -o "$tmp_file" -w '%{http_code}' "$url" || true)"
  if [[ -z "$code" || "$code" == "000" ]]; then
    fail "public check failed: ${url} (no response)"
    rm -f "$tmp_file"
    return
  fi
  if grep -q "Error 1033" "$tmp_file"; then
    fail "public check failed: ${url} (Cloudflare 1033)"
    rm -f "$tmp_file"
    return
  fi
  if (( code < 200 || code >= 400 )); then
    fail "public check failed: ${url} (http=${code})"
    rm -f "$tmp_file"
    return
  fi
  pass "public check ok: ${url} (http=${code})"
  rm -f "$tmp_file"
}

run_checks() {
  log "Step 6/8: platform checks"

  check_argocd_apps

  local ns
  for ns in "${VAULT_CA_NAMESPACES[@]}"; do
    check_ready_condition_resources "$ns" secretstores.external-secrets.io
    check_ready_condition_resources "$ns" externalsecrets.external-secrets.io
  done

  if resource_exists "$VAULT_NAMESPACE" pod "$VAULT_POD"; then
    if vault_is_initialized; then
      pass "vault initialized"
    else
      fail "vault not initialized"
    fi
    if vault_is_sealed; then
      fail "vault sealed"
    else
      pass "vault unsealed"
    fi
  else
    fail "missing Vault pod: ${VAULT_NAMESPACE}/${VAULT_POD}"
  fi

  local spec secret_ns secret_name
  for spec in "${EXPECTED_SECRET_SPECS[@]}"; do
    IFS='|' read -r secret_ns secret_name <<< "$spec"
    check_secret_exists "$secret_ns" "$secret_name"
  done

  check_velero
  check_observability

  if [[ "$SKIP_PUBLIC_CHECK" != "true" ]]; then
    local url
    IFS=',' read -r -a url_arr <<< "$PUBLIC_URLS"
    for url in "${url_arr[@]}"; do
      url="$(trim "$url")"
      [[ -z "$url" ]] && continue
      check_public_url "$url"
    done
  else
    warn "public URL checks skipped"
  fi
}

print_snapshot() {
  log "Step 7/8: snapshot"
  k get nodes -o wide || true
  k -n argocd get applications.argoproj.io \
    -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status' || true
  k -n vault get pods,svc,secret 2>/dev/null || true
  k -n velero get backupstoragelocation,schedule,backup 2>/dev/null || true
  k -n monitoring get deploy,probe,prometheusrule 2>/dev/null || true
  k -n logging get ds,deploy,pods 2>/dev/null || true
  k -n tracing get sts,deploy,pods 2>/dev/null || true
}

install_reboot_service() {
  local tmp_file
  run sudo install -m 755 "$SCRIPT_PATH" "$SERVICE_SCRIPT_PATH"
  tmp_file="$(mktemp)"
  cat >"$tmp_file" <<EOF
[Unit]
Description=Litomi platform reboot reconcile/check
Wants=network-online.target
After=network-online.target k3s.service

[Service]
Type=oneshot
User=root
Environment="KUBECTL_CMD=${SERVICE_KUBECTL_CMD}"
Environment="BOOT_WAIT_SECONDS=${SERVICE_BOOT_WAIT_SECONDS}"
Environment="CHECK_INTERVAL_SECONDS=${SERVICE_CHECK_INTERVAL_SECONDS}"
ExecStart=${SERVICE_SCRIPT_PATH} --reboot-mode --non-interactive --skip-public-check
TimeoutStartSec=${SERVICE_TIMEOUT_START_SEC}
Restart=on-failure
RestartSec=60
StartLimitIntervalSec=0
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
  run sudo install -m 644 "$tmp_file" "$SERVICE_UNIT_PATH"
  rm -f "$tmp_file"
  run sudo systemctl daemon-reload
  run sudo systemctl enable "$SERVICE_NAME"
  run sudo systemctl start "$SERVICE_NAME"
  run sudo systemctl status --no-pager --full "$SERVICE_NAME"
}

remove_reboot_service() {
  run sudo systemctl disable --now "$SERVICE_NAME" || true
  run sudo rm -f "$SERVICE_UNIT_PATH"
  run sudo systemctl daemon-reload
}

show_reboot_service_status() {
  run sudo systemctl status --no-pager --full "$SERVICE_NAME"
}

show_reboot_service_logs() {
  run sudo journalctl -u "$SERVICE_NAME" -n "$REBOOT_SERVICE_LOG_LINES" --no-pager
}

run_service_shortcuts_if_requested() {
  if [[ "$REMOVE_REBOOT_SERVICE" == "true" ]]; then
    remove_reboot_service
    exit 0
  fi
  if [[ "$SHOW_REBOOT_SERVICE_STATUS" == "true" ]]; then
    show_reboot_service_status
    exit 0
  fi
  if [[ "$SHOW_REBOOT_SERVICE_LOGS" == "true" ]]; then
    show_reboot_service_logs
    exit 0
  fi
}

print_result_and_exit() {
  printf '\nResult: %s (pass=%d warn=%d fail=%d)\n' \
    "$([[ "$FAIL_COUNT" -eq 0 ]] && echo "PASS" || echo "FAIL")" \
    "$PASS_COUNT" "$WARN_COUNT" "$FAIL_COUNT"
  if [[ "$FAIL_COUNT" -ne 0 ]]; then
    exit 1
  fi
}

main() {
  parse_args "$@"
  run_service_shortcuts_if_requested

  assert_command_exists curl
  assert_command_exists openssl

  ensure_k3s_if_needed
  ensure_argocd_and_root
  initialize_and_configure_vault
  seed_vault_secrets_from_dir
  run_reconcile_actions
  run_checks
  print_snapshot

  log "Step 8/8: optional reboot service install"
  if [[ "$CHECK_ONLY" != "true" && "$INSTALL_REBOOT_SERVICE" == "true" ]]; then
    install_reboot_service
    pass "reboot systemd service installed/enabled/started"
  else
    warn "reboot service install skipped"
  fi

  print_result_and_exit
}

main "$@"
