#!/usr/bin/env bash
# shellcheck shell=bash

wait_for_argocd_apps_healthy() {
  local waited=0
  local app
  local sync
  local health
  local first_pending
  local all_ok

  while (( waited < BOOT_WAIT_SECONDS )); do
    all_ok="true"
    first_pending=""

    for app in "${REQUIRED_ARGO_APPS[@]}"; do
      if ! resource_exists argocd applications.argoproj.io "$app"; then
        all_ok="false"
        first_pending="${app}(missing)"
        break
      fi

      sync="$(k -n argocd get applications.argoproj.io/"$app" -o jsonpath='{.status.sync.status}' 2>/dev/null || true)"
      health="$(k -n argocd get applications.argoproj.io/"$app" -o jsonpath='{.status.health.status}' 2>/dev/null || true)"
      if [[ "$sync" != "Synced" || "$health" != "Healthy" ]]; then
        all_ok="false"
        first_pending="${app}(sync=${sync:-<empty>},health=${health:-<empty>})"
        break
      fi
    done

    if [[ "$all_ok" == "true" ]]; then
      ok "required Argo CD apps are Synced/Healthy"
      return
    fi

    if should_emit_wait_log "$waited"; then
      force_refresh_argocd_apps
      force_sync_out_of_sync_argocd_apps
      log "waiting for Argo CD apps convergence (${first_pending:-pending}, ${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  k -n argocd get applications.argoproj.io \
    -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status' || true
  die "required Argo CD apps did not converge within ${BOOT_WAIT_SECONDS}s"
}

wait_for_secretstores_ready() {
  local waited=0
  local ns
  local ready
  local all_ready
  local pending
  local max_wait

  max_wait="$(as_positive_int_or_default "$POST_RECONCILE_WAIT_SECONDS" "180")"
  sync_vault_ca_configmaps_from_secret "false" "false" >/dev/null 2>&1 || true

  while (( waited < max_wait )); do
    all_ready="true"
    pending=""

    for ns in "${VAULT_CA_NAMESPACES[@]}"; do
      if ! namespace_exists "$ns"; then
        continue
      fi

      if ! resource_exists "$ns" secretstores.external-secrets.io vault; then
        all_ready="false"
        pending="${ns}/vault(missing)"
        break
      fi

      ready="$(k -n "$ns" get secretstores.external-secrets.io/vault -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status}{end}' 2>/dev/null || true)"
      if [[ "$ready" != "True" ]]; then
        all_ready="false"
        pending="${ns}/vault(ready=${ready:-<empty>})"
        break
      fi
    done

    if [[ "$all_ready" == "true" ]]; then
      ok "all Vault SecretStores are Ready=True"
      return
    fi

    if should_emit_wait_log "$waited"; then
      sync_vault_ca_configmaps_from_secret "false" "false" >/dev/null 2>&1 || true
      force_refresh_argocd_apps
      force_sync_out_of_sync_argocd_apps
      log "waiting for Vault SecretStores Ready=True (${pending:-pending}, ${waited}s/${max_wait}s)"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  warn "Vault SecretStores not fully Ready=True within ${max_wait}s; continuing"
}

wait_for_required_cluster_secrets() {
  local waited=0
  local spec
  local ns
  local name
  local missing
  local max_wait

  max_wait="$(as_positive_int_or_default "$POST_RECONCILE_WAIT_SECONDS" "180")"

  while (( waited < max_wait )); do
    missing=""

    for spec in "${REQUIRED_CLUSTER_SECRETS[@]}"; do
      IFS='|' read -r ns name <<< "$spec"
      if ! namespace_exists "$ns"; then
        continue
      fi
      if ! resource_exists "$ns" secret "$name"; then
        missing+=" ${ns}/${name}"
      fi
    done

    if [[ -z "$missing" ]]; then
      ok "all required Kubernetes secrets exist"
      return
    fi

    if should_emit_wait_log "$waited"; then
      force_refresh_argocd_apps
      force_sync_out_of_sync_argocd_apps
      log "waiting for required Kubernetes secrets:${missing} (${waited}s/${max_wait}s)"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  warn "required Kubernetes secrets still missing after ${max_wait}s:${missing}; continuing"
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

  local url
  local request_url
  local separator
  local timestamp
  local code
  local tmp_file
  local urls=()

  IFS=',' read -r -a urls <<< "$PUBLIC_URLS"

  for url in "${urls[@]}"; do
    url="$(trim "$url")"
    [[ -n "$url" ]] || continue

    timestamp="$(date +%s)"
    separator='?'
    if [[ "$url" == *\?* ]]; then
      separator='&'
    fi
    request_url="${url}${separator}_ts=${timestamp}"

    tmp_file="$(mktemp)"
    code="$(curl -kfsSL --max-time 20 -o "$tmp_file" -w '%{http_code}' "$request_url" || true)"

    if [[ -z "$code" || "$code" == "000" ]]; then
      rm -f "$tmp_file"
      die "public check failed (no response): ${url}"
    fi
    if grep -q 'Error 1033' "$tmp_file"; then
      rm -f "$tmp_file"
      die "public check failed (Cloudflare 1033): ${url}"
    fi
    if (( code < 200 || code >= 400 )); then
      rm -f "$tmp_file"
      die "public check failed (http=${code}): ${url}"
    fi

    rm -f "$tmp_file"
    ok "public check ok: ${url} (http=${code})"
  done
}

print_snapshot() {
  log "snapshot"
  k get nodes -o wide || true
  k -n argocd get applications.argoproj.io \
    -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status' || true
  k -n "$VAULT_NAMESPACE" get pods,svc,secret 2>/dev/null || true
}
