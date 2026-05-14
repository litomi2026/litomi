#!/usr/bin/env bash
# shellcheck shell=bash

K3S_TARGET_NETWORK_MODE="dual-stack"
K3S_TARGET_CLUSTER_CIDR="10.42.0.0/16,fd42:42::/56"
K3S_TARGET_SERVICE_CIDR="10.43.0.0/16,fd42:43::/112"
K3S_TARGET_FLANNEL_IPV6_MASQ="true"

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

validate_target_k3s_network_config() {
  if [[ -n "$K3S_KUBELET_NODE_IP" && "$K3S_KUBELET_NODE_IP" =~ [[:space:]] ]]; then
    die "K3S_KUBELET_NODE_IP must not contain whitespace"
  fi
}

detect_existing_cluster_network_mode() {
  local pod_cidrs

  # Fresh bootstrap starts without a cluster, but reruns should stay idempotent.
  # Reuse an existing cluster only when it already matches this script's fixed
  # dual-stack baseline.
  pod_cidrs="$(k get nodes -o jsonpath='{range .items[*]}{.spec.podCIDRs}{"\n"}{end}' 2>/dev/null || true)"
  if [[ -z "$pod_cidrs" ]]; then
    printf 'unknown'
    return
  fi

  if grep -q ':' <<< "$pod_cidrs"; then
    if grep -q '\.' <<< "$pod_cidrs"; then
      printf 'dual-stack'
    else
      printf 'ipv6'
    fi
    return
  fi

  printf 'ipv4'
}

ensure_existing_cluster_matches_target_network_mode() {
  local existing_mode

  existing_mode="$(detect_existing_cluster_network_mode)"
  if [[ "$existing_mode" != "$K3S_TARGET_NETWORK_MODE" ]]; then
    die "existing cluster network mode is ${existing_mode}, but this bootstrap now assumes ${K3S_TARGET_NETWORK_MODE}; create a new cluster instead of attempting an in-place network-family conversion"
  fi

  ok "existing cluster network mode matches target mode (${K3S_TARGET_NETWORK_MODE})"
}

build_k3s_install_exec() {
  local install_exec="server --cluster-init --secrets-encryption"

  install_exec+=" --cluster-cidr=${K3S_TARGET_CLUSTER_CIDR}"
  install_exec+=" --service-cidr=${K3S_TARGET_SERVICE_CIDR}"
  install_exec+=" --flannel-ipv6-masq"
  if [[ -n "$K3S_KUBELET_NODE_IP" ]]; then
    install_exec+=" --kubelet-arg=node-ip=${K3S_KUBELET_NODE_IP}"
  fi

  printf '%s' "$install_exec"
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
  local install_exec

  validate_target_k3s_network_config
  log "k3s network mode: ${K3S_TARGET_NETWORK_MODE}"
  log "k3s cluster CIDR: ${K3S_TARGET_CLUSTER_CIDR}"
  log "k3s service CIDR: ${K3S_TARGET_SERVICE_CIDR}"
  log "k3s flannel IPv6 masquerade: ${K3S_TARGET_FLANNEL_IPV6_MASQ}"
  if [[ -n "$K3S_KUBELET_NODE_IP" ]]; then
    log "k3s kubelet node-ip: ${K3S_KUBELET_NODE_IP}"
  fi

  if k get nodes >/dev/null 2>&1; then
    ensure_existing_cluster_matches_target_network_mode
    ok "kubernetes api already reachable"
  else
    install_exec="$(build_k3s_install_exec)"
    log "installing k3s with: ${install_exec}"
    run_root_quiet env INSTALL_K3S_EXEC="$install_exec" sh -c 'curl -sfL https://get.k3s.io | sh -'
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
