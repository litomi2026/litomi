#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/$(basename -- "${BASH_SOURCE[0]}")"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
OPS_ROOT="${SCRIPT_DIR}/platform-ops"

# shellcheck source=/dev/null
source "${OPS_ROOT}/config/defaults.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/config/specs.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/common.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/cluster.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/argocd.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/vault.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/reconcile.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/checks.sh"
# shellcheck source=/dev/null
source "${OPS_ROOT}/lib/service.sh"

usage() {
  cat <<'EOF_USAGE'
Usage:
  ./k8s/platform-ops.sh [options]

Options:
  --vault-secrets-dir <dir>  Directory with Vault seed .env files (default: ./k8s/vault-secrets)
  --skip-public-check        Skip public URL checks
  -h, --help                 Show help

Environment overrides:
  KUBECTL_CMD, BOOT_WAIT_SECONDS, CHECK_INTERVAL_SECONDS, WAIT_PROGRESS_EVERY_SECONDS,
  POST_RECONCILE_WAIT_SECONDS, KUBECTL_EXEC_TIMEOUT_SECONDS, VAULT_POD_WAIT_SECONDS,
  PUBLIC_URLS, VAULT_NAMESPACE, VAULT_POD, VAULT_ADDR, VAULT_CACERT, VAULT_TLS_DIR,
  VAULT_INIT_OUTPUT, VAULT_SECRETS_DIR
EOF_USAGE
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --vault-secrets-dir)
        [[ $# -ge 2 ]] || die "--vault-secrets-dir requires a value"
        VAULT_SECRETS_DIR="$2"
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
        die "unknown argument: $1"
        ;;
    esac
  done
}

main() {
  init_runtime
  parse_args "$@"

  ensure_host_dependencies

  log "Vault init output: ${VAULT_INIT_OUTPUT}"
  log "Vault secrets dir: ${VAULT_SECRETS_DIR}"

  step "Step 1/9: k3s install/check"
  ensure_k3s_if_needed

  step "Step 2/9: Argo CD bootstrap/control plane"
  ensure_argocd_bootstrap_and_control_plane

  step "Step 3/9: Vault TLS assets"
  ensure_vault_tls_assets

  step "Step 4/9: Vault init/unseal"
  initialize_and_unseal_vault

  step "Step 5/9: Vault auth/policy/role bootstrap"
  configure_vault_for_eso

  step "Step 6/9: Vault secret seeding"
  seed_vault_secrets_from_dir

  step "Step 7/9: reconcile"
  run_reconcile_actions

  step "Step 8/9: platform checks"
  wait_for_argocd_apps_healthy
  wait_for_secretstores_ready
  wait_for_required_cluster_secrets
  check_vault_runtime_health
  check_public_urls

  step "Step 9/9: install reboot service"
  install_or_update_reboot_service
  print_snapshot

  print_summary "PASS" "platform bootstrap complete"
}

main "$@"
