#!/usr/bin/env bash
# shellcheck shell=bash

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

  [[ -s "$output_file" ]]
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

  run_quiet openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -subj '/CN=litomi-vault-ca' \
    -keyout "$ca_key" -out "$ca_crt"

  cat >"$server_cnf" <<'EOF_SERVER_CNF'
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
EOF_SERVER_CNF

  run_quiet openssl req -new -newkey rsa:4096 -nodes -sha256 \
    -keyout "$tls_key" -out "$tls_csr" -config "$server_cnf"

  run_quiet openssl x509 -req -sha256 -days 825 \
    -in "$tls_csr" -CA "$ca_crt" -CAkey "$ca_key" -CAcreateserial \
    -out "$tls_crt" -extensions req_ext -extfile "$server_cnf"

  ok "generated vault tls assets"
}

sync_vault_ca_configmaps_from_file() {
  local source_ca="$1"
  local log_missing="${2:-true}"
  local emit_ok="${3:-true}"
  local ns
  local manifest

  for ns in "${VAULT_CA_NAMESPACES[@]}"; do
    if ! namespace_exists "$ns"; then
      if [[ "$log_missing" == "true" ]]; then
        log "namespace missing for vault-ca sync (will retry later): ${ns}"
      fi
      continue
    fi

    manifest="$(mktemp)"
    if ! k -n "$ns" create configmap vault-ca \
      --from-file=ca.crt="$source_ca" \
      --dry-run=client -o yaml >"$manifest"; then
      rm -f "$manifest"
      die "failed to render ${ns}/vault-ca configmap manifest"
    fi

    k_quiet -n "$ns" apply -f "$manifest"
    rm -f "$manifest"

    if [[ "$emit_ok" == "true" ]]; then
      ok "synced vault-ca configmap: ${ns}/vault-ca"
    fi
  done
}

sync_vault_ca_configmaps_from_secret() {
  local log_missing="${1:-true}"
  local emit_ok="${2:-true}"
  local tmp_ca

  tmp_ca="$(mktemp)"
  if ! write_secret_field_to_file "$VAULT_NAMESPACE" vault-tls 'ca\.crt' "$tmp_ca"; then
    rm -f "$tmp_ca"
    return 1
  fi

  sync_vault_ca_configmaps_from_file "$tmp_ca" "$log_missing" "$emit_ok"
  rm -f "$tmp_ca"
}

ensure_vault_tls_assets() {
  wait_for_namespace "$VAULT_NAMESPACE"

  if ! resource_exists "$VAULT_NAMESPACE" secret vault-tls; then
    local manifest

    generate_vault_tls_files
    assert_file_exists "${VAULT_TLS_DIR}/ca.crt"
    assert_file_exists "${VAULT_TLS_DIR}/tls.crt"
    assert_file_exists "${VAULT_TLS_DIR}/tls.key"

    manifest="$(mktemp)"
    if ! k -n "$VAULT_NAMESPACE" create secret generic vault-tls \
      --from-file=tls.crt="${VAULT_TLS_DIR}/tls.crt" \
      --from-file=tls.key="${VAULT_TLS_DIR}/tls.key" \
      --from-file=ca.crt="${VAULT_TLS_DIR}/ca.crt" \
      --dry-run=client -o yaml >"$manifest"; then
      rm -f "$manifest"
      die "failed to render ${VAULT_NAMESPACE}/vault-tls secret manifest"
    fi

    k_quiet -n "$VAULT_NAMESPACE" apply -f "$manifest"
    rm -f "$manifest"
    ok "applied ${VAULT_NAMESPACE}/vault-tls"
  else
    ok "vault tls secret already exists"
  fi

  if ! sync_vault_ca_configmaps_from_secret "true" "true"; then
    die "failed to read ca.crt from ${VAULT_NAMESPACE}/vault-tls"
  fi
}

wait_for_vault_pod_running() {
  wait_for_resource "$VAULT_NAMESPACE" pod "$VAULT_POD"

  local timeout_seconds
  local waited=0
  local phase

  timeout_seconds="$(as_positive_int_or_default "$VAULT_POD_WAIT_SECONDS" "$BOOT_WAIT_SECONDS")"

  while (( waited < timeout_seconds )); do
    phase="$(k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" -o jsonpath='{.status.phase}' 2>/dev/null || true)"
    if [[ "$phase" == "Running" ]]; then
      ok "vault pod is running: ${VAULT_NAMESPACE}/${VAULT_POD}"
      return
    fi

    if should_emit_wait_log "$waited"; then
      log "waiting for vault pod Running (phase=${phase:-<empty>}, ${waited}s/${timeout_seconds}s)"
    fi

    sleep "$CHECK_INTERVAL_SECONDS"
    waited=$((waited + CHECK_INTERVAL_SECONDS))
  done

  k -n "$VAULT_NAMESPACE" get "pod/${VAULT_POD}" -o wide || true
  k -n "$VAULT_NAMESPACE" describe "pod/${VAULT_POD}" || true
  k -n "$VAULT_NAMESPACE" logs "pod/${VAULT_POD}" --tail=200 || true
  die "vault pod is not running: ${VAULT_NAMESPACE}/${VAULT_POD}"
}

run_with_exec_timeout() {
  if command -v timeout >/dev/null 2>&1; then
    timeout "${KUBECTL_EXEC_TIMEOUT_SECONDS}s" "$@"
    return
  fi
  "$@"
}

vault_exec() {
  run_with_exec_timeout \
    "${KUBECTL_ARR[@]}" -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" "$@"
}

vault_exec_stdin() {
  run_with_exec_timeout \
    "${KUBECTL_ARR[@]}" -n "$VAULT_NAMESPACE" exec -i "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" "$@"
}

vault_exec_token() {
  local token="$1"
  shift
  run_with_exec_timeout \
    "${KUBECTL_ARR[@]}" -n "$VAULT_NAMESPACE" exec "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" VAULT_TOKEN="$token" "$@"
}

vault_exec_token_stdin() {
  local token="$1"
  shift
  run_with_exec_timeout \
    "${KUBECTL_ARR[@]}" -n "$VAULT_NAMESPACE" exec -i "$VAULT_POD" -- \
    env VAULT_ADDR="$VAULT_ADDR" VAULT_CACERT="$VAULT_CACERT" VAULT_TOKEN="$token" "$@"
}

vault_status_output() {
  vault_exec vault status -format=json 2>/dev/null || true
}

vault_is_initialized() {
  local status
  status="$(vault_status_output)"
  [[ -n "$status" ]] || return 1
  printf '%s\n' "$status" | grep -Eq '"initialized"[[:space:]]*:[[:space:]]*true'
}

vault_is_sealed() {
  local status
  status="$(vault_status_output)"
  [[ -n "$status" ]] || return 1
  printf '%s\n' "$status" | grep -Eq '"sealed"[[:space:]]*:[[:space:]]*true'
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
  [[ -f "$VAULT_INIT_OUTPUT" ]] || return 1
  extract_root_token_from_json "$VAULT_INIT_OUTPUT" 2>/dev/null || true
}

collect_unseal_keys() {
  [[ -f "$VAULT_INIT_OUTPUT" ]] || return 1
  extract_unseal_keys_from_json "$VAULT_INIT_OUTPUT" 2>/dev/null || true
}

initialize_and_unseal_vault() {
  wait_for_vault_pod_running

  if ! vault_is_initialized; then
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
    local raw_key
    local key
    local keys=()

    while IFS= read -r raw_key; do
      key="$(trim "$raw_key")"
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
  local token
  token="$(resolve_root_token || true)"
  [[ -n "$token" ]] || die "cannot read Vault root token from ${VAULT_INIT_OUTPUT}"

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

  local spec
  local policy
  local prefix
  local role
  local role_ns
  local role_policy

  for spec in "${VAULT_POLICY_SPECS[@]}"; do
    IFS='|' read -r policy prefix <<< "$spec"
    cat <<EOF_POLICY | vault_exec_token_stdin "$token" vault policy write "$policy" - >/dev/null
path "kv/data/${prefix}/*" {
  capabilities = ["read"]
}
EOF_POLICY
    ok "vault policy applied: ${policy}"
  done

  for spec in "${VAULT_ROLE_SPECS[@]}"; do
    IFS='|' read -r role role_ns role_policy <<< "$spec"
    vault_exec_token "$token" vault write "auth/kubernetes/role/${role}" \
      bound_service_account_names=eso-vault \
      bound_service_account_namespaces="$role_ns" \
      policies="$role_policy" \
      audience=vault \
      ttl=1h >/dev/null
    ok "vault role applied: ${role}"
  done
}

validate_seed_directory_layout() {
  [[ -d "$VAULT_SECRETS_DIR" ]] || die "vault secrets dir not found: ${VAULT_SECRETS_DIR}"

  local rel_path
  local env_file
  local schema_file
  local schema_key
  local schema_has_keys

  for rel_path in "${REQUIRED_SEED_FILES[@]}"; do
    env_file="${VAULT_SECRETS_DIR}/${rel_path}"
    schema_file="${env_file}.example"

    [[ -f "$env_file" ]] || die "missing required seed file: ${env_file}"
    [[ -f "$schema_file" ]] || die "missing required seed schema file: ${schema_file}"

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
  local raw
  local line
  local key
  local value

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
    kv_pairs+=("${key}=${value}")
  done < "$env_file"

  if [[ ${#kv_pairs[@]} -eq 0 ]]; then
    die "no key/value found in ${env_file}"
  fi

  vault_exec_token "$token" vault kv put "kv/${kv_path}" "${kv_pairs[@]}" >/dev/null
  ok "seeded vault kv: kv/${kv_path}"
}

seed_vault_secrets_from_dir() {
  validate_seed_directory_layout

  local token
  token="$(resolve_root_token || true)"
  [[ -n "$token" ]] || die "cannot seed vault secrets without root token"

  local env_files=()
  mapfile -t env_files < <(find "$VAULT_SECRETS_DIR" -type f -name '*.env' | sort || true)
  [[ ${#env_files[@]} -gt 0 ]] || die "no .env files found in ${VAULT_SECRETS_DIR}"

  local env_file
  local rel_path
  local kv_path

  for env_file in "${env_files[@]}"; do
    [[ -n "$env_file" ]] || continue
    rel_path="${env_file#${VAULT_SECRETS_DIR}/}"
    kv_path="${rel_path%.env}"
    put_vault_kv_from_env_file "$token" "$kv_path" "$env_file"
  done
}
