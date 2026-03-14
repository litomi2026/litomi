#!/usr/bin/env bash

set -euo pipefail

DEFAULT_VM="ubuntu"
DEFAULT_KUBECONFIG_PATH="${HOME}/.kube/litomi-ubuntu.yaml"
DEFAULT_LOCAL_API_PORT="16443"
DEFAULT_REMOTE_API_PORT="6443"
DEFAULT_REMOTE_K3S_KUBECONFIG_PATH="/etc/rancher/k3s/k3s.yaml"

LITOMI_MAC_MINI_HOST="${LITOMI_MAC_MINI_HOST:-}"
LITOMI_MAC_MINI_USER="${LITOMI_MAC_MINI_USER:-${USER}}"
LITOMI_ORBSTACK_VM="${LITOMI_ORBSTACK_VM:-${DEFAULT_VM}}"
LITOMI_KUBECONFIG_PATH="${LITOMI_KUBECONFIG_PATH:-${DEFAULT_KUBECONFIG_PATH}}"
LITOMI_LOCAL_API_PORT="${LITOMI_LOCAL_API_PORT:-${DEFAULT_LOCAL_API_PORT}}"
LITOMI_REMOTE_API_PORT="${LITOMI_REMOTE_API_PORT:-${DEFAULT_REMOTE_API_PORT}}"
LITOMI_REMOTE_K3S_KUBECONFIG_PATH="${LITOMI_REMOTE_K3S_KUBECONFIG_PATH:-${DEFAULT_REMOTE_K3S_KUBECONFIG_PATH}}"

usage() {
  cat <<EOF
Usage:
  $(basename "$0") [options] <command> [args...]

Commands:
  setup                 Fetch the remote k3s kubeconfig and rewrite it for a local SSH tunnel.
  tunnel                Open a persistent SSH tunnel to the remote k3s API server.
  help                  Show this help.

Options:
  --host <host>               Mac mini hostname or IP address.
  --user <user>               SSH username for the Mac mini. Default: current macOS user.
  --vm <name>                 OrbStack VM name. Default: ${DEFAULT_VM}
  --kubeconfig <path>         Local kubeconfig path. Default: ${DEFAULT_KUBECONFIG_PATH}
  --local-port <port>         Local forwarded Kubernetes API port. Default: ${DEFAULT_LOCAL_API_PORT}
  --remote-port <port>        Remote Kubernetes API port. Default: ${DEFAULT_REMOTE_API_PORT}
  --remote-k3s-config <path>  Remote k3s kubeconfig path. Default: ${DEFAULT_REMOTE_K3S_KUBECONFIG_PATH}
  -h, --help                  Show this help.

Environment variables:
  LITOMI_MAC_MINI_HOST
  LITOMI_MAC_MINI_USER
  LITOMI_ORBSTACK_VM
  LITOMI_KUBECONFIG_PATH
  LITOMI_LOCAL_API_PORT
  LITOMI_REMOTE_API_PORT
  LITOMI_REMOTE_K3S_KUBECONFIG_PATH

Examples:
  $(basename "$0") --host my-mac-mini.local setup
  $(basename "$0") --host 192.168.0.10 tunnel
EOF
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '[litomi-k3s-connect] %s\n' "$*"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

remote_target() {
  printf '%s@%s' "${LITOMI_MAC_MINI_USER}" "${LITOMI_MAC_MINI_HOST}"
}

ensure_remote_target() {
  [[ -n "${LITOMI_MAC_MINI_HOST}" ]] || die "missing Mac mini host. Set --host or LITOMI_MAC_MINI_HOST."
  [[ -n "${LITOMI_MAC_MINI_USER}" ]] || die "missing Mac mini user. Set --user or LITOMI_MAC_MINI_USER."
}

run_remote() {
  ssh -o ExitOnForwardFailure=yes "$(remote_target)" "$@"
}

fetch_remote_kubeconfig() {
  local remote_cmd
  printf -v remote_cmd \
    'PATH="$HOME/.orbstack/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"; orb -m %q sudo cat %q' \
    "${LITOMI_ORBSTACK_VM}" "${LITOMI_REMOTE_K3S_KUBECONFIG_PATH}"
  run_remote "${remote_cmd}"
}

rewrite_kubeconfig_server() {
  local src="$1"
  local dst="$2"

  awk -v port="${LITOMI_LOCAL_API_PORT}" '
    BEGIN {
      rewritten = 0
    }
    /^[[:space:]]*server:[[:space:]]+/ && rewritten == 0 {
      print "    server: https://127.0.0.1:" port
      rewritten = 1
      next
    }
    {
      print
    }
    END {
      if (rewritten == 0) {
        exit 42
      }
    }
  ' "${src}" > "${dst}" || die "failed to rewrite kubeconfig server endpoint"
}

cmd_setup() {
  local tmp_file
  ensure_remote_target
  require_command ssh
  require_command awk
  require_command mkdir
  require_command chmod

  mkdir -p "$(dirname "${LITOMI_KUBECONFIG_PATH}")"
  tmp_file="$(mktemp)"
  trap 'rm -f "${tmp_file}"' EXIT

  log "fetching kubeconfig from $(remote_target) via OrbStack VM '${LITOMI_ORBSTACK_VM}'"
  fetch_remote_kubeconfig > "${tmp_file}"
  rewrite_kubeconfig_server "${tmp_file}" "${LITOMI_KUBECONFIG_PATH}"
  chmod 600 "${LITOMI_KUBECONFIG_PATH}"

  log "wrote ${LITOMI_KUBECONFIG_PATH}"
  log "next: $(basename "$0") --host ${LITOMI_MAC_MINI_HOST} tunnel"
  log "then: export KUBECONFIG=${LITOMI_KUBECONFIG_PATH}"
}

cmd_tunnel() {
  ensure_remote_target
  require_command ssh

  log "opening SSH tunnel ${LITOMI_LOCAL_API_PORT} -> $(remote_target):127.0.0.1:${LITOMI_REMOTE_API_PORT}"
  exec ssh \
    -o ExitOnForwardFailure=yes \
    -L "${LITOMI_LOCAL_API_PORT}:127.0.0.1:${LITOMI_REMOTE_API_PORT}" \
    -N \
    "$(remote_target)"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --host)
        [[ $# -ge 2 ]] || die "--host requires a value"
        LITOMI_MAC_MINI_HOST="$2"
        shift 2
        ;;
      --user)
        [[ $# -ge 2 ]] || die "--user requires a value"
        LITOMI_MAC_MINI_USER="$2"
        shift 2
        ;;
      --vm)
        [[ $# -ge 2 ]] || die "--vm requires a value"
        LITOMI_ORBSTACK_VM="$2"
        shift 2
        ;;
      --kubeconfig)
        [[ $# -ge 2 ]] || die "--kubeconfig requires a value"
        LITOMI_KUBECONFIG_PATH="$2"
        shift 2
        ;;
      --local-port)
        [[ $# -ge 2 ]] || die "--local-port requires a value"
        LITOMI_LOCAL_API_PORT="$2"
        shift 2
        ;;
      --remote-port)
        [[ $# -ge 2 ]] || die "--remote-port requires a value"
        LITOMI_REMOTE_API_PORT="$2"
        shift 2
        ;;
      --remote-k3s-config)
        [[ $# -ge 2 ]] || die "--remote-k3s-config requires a value"
        LITOMI_REMOTE_K3S_KUBECONFIG_PATH="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      help)
        usage
        exit 0
        ;;
      *)
        break
        ;;
    esac
  done

  COMMAND="${1:-help}"
  if [[ $# -gt 0 ]]; then
    shift
  fi
}

main() {
  parse_args "$@"

  case "${COMMAND}" in
    setup)
      cmd_setup
      ;;
    tunnel)
      cmd_tunnel
      ;;
    help)
      usage
      ;;
    *)
      die "unknown command: ${COMMAND}"
      ;;
  esac
}

main "$@"
