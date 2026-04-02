#!/usr/bin/env bash
# shellcheck shell=bash

ensure_argocd_cm_labels() {
  if ! resource_exists argocd configmap argocd-cm; then
    die "missing configmap: argocd/argocd-cm"
  fi

  k_quiet -n argocd label configmap argocd-cm \
    app.kubernetes.io/name=argocd-cm \
    app.kubernetes.io/part-of=argocd \
    --overwrite
  ok "argocd-cm labels ensured"
}

ensure_argocd_server_ca_secret() {
  wait_for_resource argocd secret argocd-secret

  local encoded
  local tmp_ca
  local manifest
  local waited=0
  local cert_wait_timeout

  cert_wait_timeout="$(as_positive_int_or_default "$BOOT_WAIT_SECONDS" "900")"
  while (( waited < cert_wait_timeout )); do
    encoded="$(k -n argocd get secret argocd-secret -o jsonpath='{.data.tls\.crt}' 2>/dev/null || true)"
    if [[ -n "$encoded" ]]; then
      break
    fi
    if should_emit_wait_log "$waited"; then
      log "waiting for argocd-secret tls.crt (${waited}s/${cert_wait_timeout}s)"
    fi
    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  [[ -n "$encoded" ]] || die "missing tls.crt in argocd/argocd-secret"

  tmp_ca="$(mktemp)"
  manifest="$(mktemp)"

  if ! printf '%s' "$encoded" | base64 -d >"$tmp_ca" 2>/dev/null; then
    rm -f "$tmp_ca" "$manifest"
    die "failed to decode argocd/argocd-secret tls.crt"
  fi

  if [[ ! -s "$tmp_ca" ]]; then
    rm -f "$tmp_ca" "$manifest"
    die "decoded argocd TLS certificate is empty"
  fi

  if ! k -n argocd create secret generic argocd-server-ca \
    --from-file=ca.crt="$tmp_ca" \
    --dry-run=client -o yaml >"$manifest"; then
    rm -f "$tmp_ca" "$manifest"
    die "failed to render argocd-server-ca secret manifest"
  fi

  k_quiet -n argocd apply -f "$manifest"
  rm -f "$tmp_ca" "$manifest"
  ok "argocd server CA secret ensured"
}

ensure_argocd_server_transport_dependency() {
  local server_transport_ref

  server_transport_ref="$(k -n argocd get service argocd-server -o jsonpath='{.metadata.annotations.traefik\.ingress\.kubernetes\.io/service\.serverstransport}' 2>/dev/null || true)"

  if [[ -z "$server_transport_ref" ]]; then
    ok "argocd-server has no ServersTransport annotation; dependency check skipped"
    return
  fi

  if [[ "$server_transport_ref" != "argocd-argocd-server-transport@kubernetescrd" ]]; then
    die "unexpected argocd-server ServersTransport reference (${server_transport_ref}); expected argocd-argocd-server-transport@kubernetescrd"
  fi

  wait_for_resource argocd serverstransports.traefik.io argocd-server-transport
  wait_for_resource argocd secret argocd-server-ca
  ok "argocd Traefik ServersTransport dependency verified"
}

argocd_bootstrap_repo_credentials_env_file() {
  printf '%s' "${VAULT_SECRETS_DIR}/argocd/github-repo-creds.env"
}

validate_argocd_bootstrap_repo_credentials_layout() {
  local env_file
  local schema_file
  local schema_key
  local schema_has_keys

  env_file="$(argocd_bootstrap_repo_credentials_env_file)"
  schema_file="${env_file}.example"

  [[ -f "$env_file" ]] || die "missing required Argo CD bootstrap repo credentials file: ${env_file}"
  [[ -f "$schema_file" ]] || die "missing required Argo CD bootstrap repo credentials schema file: ${schema_file}"

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
}

argocd_repo_credentials_secret_is_ready() {
  local secret_type
  local key
  local encoded

  if ! resource_exists argocd secret github-repo-creds; then
    return 1
  fi

  secret_type="$(k -n argocd get secret github-repo-creds -o go-template='{{ index .metadata.labels "argocd.argoproj.io/secret-type" }}' 2>/dev/null || true)"
  [[ "$secret_type" == "repo-creds" ]] || return 1

  for key in type url githubAppID githubAppInstallationID githubAppPrivateKey; do
    encoded="$(k -n argocd get secret github-repo-creds -o "jsonpath={.data.${key}}" 2>/dev/null || true)"
    [[ -n "$encoded" ]] || return 1
  done

  return 0
}

ensure_argocd_bootstrap_repo_credentials() {
  local env_file
  local manifest
  local tmp_file
  local raw
  local line
  local key
  local value
  local entry_count=0
  local -a render_cmd=()
  local -a temp_files=()

  env_file="$(argocd_bootstrap_repo_credentials_env_file)"
  validate_argocd_bootstrap_repo_credentials_layout

  if argocd_repo_credentials_secret_is_ready; then
    ok "Argo CD repo credentials secret already exists: argocd/github-repo-creds"
    return
  fi

  if resource_exists argocd secret github-repo-creds; then
    die "argocd/github-repo-creds exists but is not a valid repo-creds secret; inspect or delete it and rerun"
  fi

  wait_for_namespace argocd
  manifest="$(mktemp)"
  render_cmd=(
    k -n argocd create secret generic github-repo-creds
    --type Opaque
    --dry-run=client
    -o yaml
  )

  while IFS= read -r raw || [[ -n "$raw" ]]; do
    line="$(trim "$raw")"
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue

    if [[ "${line#export }" != "$line" ]]; then
      line="${line#export }"
    fi

    [[ "$line" == *=* ]] || continue

    key="$(trim "${line%%=*}")"
    value="${line#*=}"
    [[ -z "$key" ]] && continue

    value="$(normalize_env_value "$value")"
    if [[ "$value" == *$'\n'* ]]; then
      tmp_file="$(mktemp)"
      printf '%s' "$value" >"$tmp_file"
      temp_files+=("$tmp_file")
      render_cmd+=(--from-file="${key}=${tmp_file}")
    else
      render_cmd+=(--from-literal="${key}=${value}")
    fi

    entry_count=$((entry_count + 1))
  done < "$env_file"

  if (( entry_count == 0 )); then
    rm -f "$manifest" "${temp_files[@]}"
    die "no key/value found in ${env_file}"
  fi

  if ! "${render_cmd[@]}" >"$manifest"; then
    rm -f "$manifest" "${temp_files[@]}"
    die "failed to render argocd/github-repo-creds secret manifest"
  fi

  if ! k_quiet_or_return apply --server-side -f "$manifest"; then
    rm -f "$manifest" "${temp_files[@]}"
    die "failed to apply argocd/github-repo-creds secret manifest"
  fi
  if ! k_quiet_or_return -n argocd label secret github-repo-creds argocd.argoproj.io/secret-type=repo-creds --overwrite; then
    rm -f "$manifest" "${temp_files[@]}"
    die "failed to label argocd/github-repo-creds as repo-creds"
  fi

  rm -f "$manifest" "${temp_files[@]}"
  ok "Argo CD bootstrap repo credentials secret ensured: argocd/github-repo-creds"
}

argocd_control_plane_missing_resources() {
  local -a missing=()

  if ! namespace_exists argocd; then
    missing+=("namespace/argocd")
  fi

  if namespace_exists argocd; then
    resource_exists argocd deployment argocd-server || missing+=("deployment/argocd-server")
    resource_exists argocd deployment argocd-repo-server || missing+=("deployment/argocd-repo-server")
    resource_exists argocd statefulset argocd-application-controller || missing+=("statefulset/argocd-application-controller")
    resource_exists argocd configmap argocd-cm || missing+=("configmap/argocd-cm")
    resource_exists argocd configmap argocd-cmd-params-cm || missing+=("configmap/argocd-cmd-params-cm")
  fi

  printf '%s\n' "${missing[@]}"
}

ensure_argocd_bootstrap_ownership_boundary() {
  local -a protected_specs=(
    "ConfigMap|argocd|argocd-cm"
    "ConfigMap|argocd|argocd-cmd-params-cm"
    "Deployment|argocd|argocd-repo-server"
    "StatefulSet|argocd|argocd-application-controller"
  )
  local -a apps=()
  local -a conflicts=()
  local app
  local resources
  local spec
  local kind
  local ns
  local name

  while IFS= read -r app; do
    [[ -n "$app" ]] || continue
    apps+=("$app")
  done < <(k -n argocd get applications.argoproj.io -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)

  for app in "${apps[@]}"; do
    resources="$(k -n argocd get applications.argoproj.io "$app" -o jsonpath='{range .status.resources[*]}{.kind}{"|"}{.namespace}{"|"}{.name}{"\n"}{end}' 2>/dev/null || true)"
    [[ -n "$resources" ]] || continue

    for spec in "${protected_specs[@]}"; do
      if printf '%s\n' "$resources" | grep -Fxq "$spec"; then
        IFS='|' read -r kind ns name <<< "$spec"
        conflicts+=("${app}->${ns}/${kind}/${name}")
      fi
    done
  done

  if (( ${#conflicts[@]} > 0 )); then
    die "bootstrap/app ownership boundary violated (bootstrap-owned resources tracked by Argo CD app): ${conflicts[*]}"
  fi

  ok "bootstrap/app ownership boundary verified"
}

wait_for_root_app_synced_healthy() {
  local waited=0
  local sync
  local health

  k -n argocd annotate applications.argoproj.io/root argocd.argoproj.io/refresh=hard --overwrite >/dev/null 2>&1 || true

  while (( waited < BOOT_WAIT_SECONDS )); do
    sync="$(k -n argocd get applications.argoproj.io/root -o jsonpath='{.status.sync.status}' 2>/dev/null || true)"
    health="$(k -n argocd get applications.argoproj.io/root -o jsonpath='{.status.health.status}' 2>/dev/null || true)"

    if [[ "$sync" == "Synced" && "$health" == "Healthy" ]]; then
      ok "root app is Synced/Healthy"
      return
    fi

    if should_emit_wait_log "$waited"; then
      k -n argocd annotate applications.argoproj.io/root argocd.argoproj.io/refresh=hard --overwrite >/dev/null 2>&1 || true
      log "waiting for root app sync/health (sync=${sync:-<empty>}, health=${health:-<empty>}, ${waited}s/${BOOT_WAIT_SECONDS}s)"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  k -n argocd get applications.argoproj.io \
    -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status' || true
  die "root app did not become Synced/Healthy within ${BOOT_WAIT_SECONDS}s"
}

wait_for_rollout_with_progress_deadline_retry() {
  local ns="$1"
  local resource="$2"
  local label="$3"
  local retries_on_progress_deadline="${4:-0}"
  local attempt=1
  local output

  while true; do
    if output="$(k -n "$ns" rollout status "$resource" --timeout="${BOOT_WAIT_SECONDS}s" 2>&1)"; then
      ok "${label} rollout complete"
      return
    fi

    printf '%s\n' "$output" >&2

    if (( attempt <= retries_on_progress_deadline )) && [[ "$output" == *"exceeded its progress deadline"* ]]; then
      warn "${label} rollout exceeded progress deadline; retrying once"
      attempt=$((attempt + 1))
      sleep "$CHECK_INTERVAL_SECONDS"
      continue
    fi

    k -n "$ns" get pods -o wide || true
    k -n "$ns" describe "$resource" || true
    die "${label} rollout failed"
  done
}

ensure_argocd_bootstrap_and_control_plane() {
  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/argocd/kustomization.yaml"
  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"

  local -a missing=()
  local entry

  if [[ "${FORCE_ARGOCD_BOOTSTRAP_APPLY:-false}" == "true" ]]; then
    log "forcing full Argo CD bootstrap reapply"
    missing=("forced")
  else
    while IFS= read -r entry; do
      [[ -n "$entry" ]] || continue
      missing+=("$entry")
    done < <(argocd_control_plane_missing_resources)
  fi

  if (( ${#missing[@]} > 0 )); then
    if [[ "${FORCE_ARGOCD_BOOTSTRAP_APPLY:-false}" != "true" ]]; then
      log "Argo CD control plane missing (${missing[*]}), applying bootstrap manifests"
    fi
    k_quiet apply --server-side --force-conflicts -k "${REPO_ROOT}/k8s/bootstrap/argocd"
    ok "Argo CD control plane bootstrap applied"
  else
    ok "Argo CD control plane already present; bootstrap reapply skipped"
  fi

  ensure_argocd_bootstrap_repo_credentials

  k_quiet apply --server-side -f "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"
  ok "Argo CD root app applied"

  ensure_argocd_cm_labels

  wait_for_resource argocd deployment argocd-server
  wait_for_resource argocd deployment argocd-repo-server
  wait_for_resource argocd statefulset argocd-application-controller

  log "waiting rollout: argocd/deployment argocd-server"
  wait_for_rollout_with_progress_deadline_retry argocd deployment/argocd-server argocd-server 0

  log "waiting rollout: argocd/deployment argocd-repo-server"
  wait_for_rollout_with_progress_deadline_retry argocd deployment/argocd-repo-server argocd-repo-server 1

  log "waiting rollout: argocd/statefulset argocd-application-controller"
  wait_for_rollout_with_progress_deadline_retry argocd statefulset/argocd-application-controller argocd-application-controller 0

  ensure_argocd_server_ca_secret

  wait_for_resource argocd applications.argoproj.io root
  wait_for_root_app_synced_healthy
  ensure_argocd_server_transport_dependency
  ensure_argocd_bootstrap_ownership_boundary
}
