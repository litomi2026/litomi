#!/usr/bin/env bash
# shellcheck shell=bash

ensure_host_dependencies() {
  local required=(curl openssl python3 awk sed base64 find sort iptables-save ip6tables-save)
  local cmd
  local missing=()

  for cmd in "${required[@]}"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing+=("$cmd")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    ok "host dependencies already available"
    return
  fi

  if command -v apt >/dev/null 2>&1; then
    log "installing missing host dependencies: ${missing[*]}"
    run_root_quiet apt -qq update
    run_root_quiet apt install -qq -y \
      curl openssl python3 coreutils findutils iptables
  else
    die "missing commands (${missing[*]}), and apt is unavailable"
  fi

  for cmd in "${required[@]}"; do
    assert_command_exists "$cmd"
  done
  ok "host dependencies installed"
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
  if wait_until "$BOOT_WAIT_SECONDS" "kubernetes api readyz" k8s_api_ready; then
    ok "kubernetes api is ready"
    return
  fi
  die "kubernetes api not ready within ${BOOT_WAIT_SECONDS}s"
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

wait_for_namespace() {
  local ns="$1"
  if wait_until "$BOOT_WAIT_SECONDS" "namespace ${ns}" namespace_exists "$ns"; then
    ok "namespace ready: ${ns}"
    return
  fi
  die "namespace not found within timeout: ${ns}"
}

wait_for_resource() {
  local ns="$1"
  local kind="$2"
  local name="$3"
  if wait_until "$BOOT_WAIT_SECONDS" "resource ${ns}/${kind}/${name}" resource_exists "$ns" "$kind" "$name"; then
    ok "resource ready: ${ns}/${kind}/${name}"
    return
  fi
  die "resource not found within timeout: ${ns}/${kind}/${name}"
}

k8s_api_ready() {
  k get --raw='/readyz' 2>/dev/null | grep -q 'ok'
}

ensure_k3s_if_needed() {
  if k get nodes >/dev/null 2>&1; then
    ok "kubernetes api already reachable"
  else
    run_root_quiet bash -c 'curl -sfL https://get.k3s.io | sh -s - server --cluster-init --secrets-encryption'
    ok "k3s install command completed"
  fi

  wait_for_api_ready
  wait_for_node_registration

  if ! k_quiet_or_return wait --for=condition=Ready node --all --timeout="${BOOT_WAIT_SECONDS}s"; then
    k get nodes -o wide || true
    die "node readiness check failed"
  fi
  ok "all nodes are Ready"
}
