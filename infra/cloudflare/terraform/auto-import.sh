#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

export TF_IN_AUTOMATION=1
export NO_COLOR=1

TF_VAR_FILE="${TF_VAR_FILE:-terraform.tfvars}"
DRY_RUN="${DRY_RUN:-0}"

ZONE_ID=""
ACCOUNT_ID=""
DOMAIN=""
STATE_ADDRESSES=""
IMPORTED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
CF_LAST_STATUS=0

log() {
  printf '%s\n' "$*"
}

info() {
  log "[INFO] $*"
}

warn() {
  log "[WARN] $*" >&2
}

die() {
  log "[ERROR] $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

load_env() {
  [ -f ".env" ] || die ".env file not found. Please run setup.sh first."

  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a

  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] || die "CLOUDFLARE_API_TOKEN is not set."
}

ensure_terraform_init() {
  if [ ! -d ".terraform" ]; then
    info "Initializing Terraform..."
    terraform init -input=false >/dev/null
  fi
}

read_tfvar() {
  local key="$1"
  local value

  value="$(
    sed -n "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*\"\\([^\"]*\\)\"[[:space:]]*$/\\1/p" "$TF_VAR_FILE" | head -n 1
  )"

  [ -n "$value" ] || die "Could not read ${key} from ${TF_VAR_FILE}"
  printf '%s\n' "$value"
}

refresh_state_addresses() {
  STATE_ADDRESSES="$(terraform state list 2>/dev/null || true)"
}

state_has() {
  [ -n "$STATE_ADDRESSES" ] && printf '%s\n' "$STATE_ADDRESSES" | grep -Fxq "$1"
}

record_import() {
  IMPORTED_COUNT=$((IMPORTED_COUNT + 1))
  info "$1"
}

record_skip() {
  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
  info "$1"
}

record_failure() {
  FAILED_COUNT=$((FAILED_COUNT + 1))
  warn "$1"
}

terraform_eval_string() {
  local expr="$1"
  local raw

  raw="$(
    terraform console -var-file="$TF_VAR_FILE" 2>/dev/null <<EOF
try(tostring(nonsensitive(${expr})), tostring(${expr}), "")
EOF
  )" || die "Failed to evaluate Terraform expression: $expr"

  raw="$(printf '%s' "$raw" | tail -n 1 | tr -d '\r')"

  case "$raw" in
    "" | "null" | "(known after apply)" | "(sensitive value)")
      printf '\n'
      return 0
      ;;
  esac

  if printf '%s' "$raw" | jq -eR 'fromjson? | type == "string"' >/dev/null 2>&1; then
    printf '%s' "$raw" | jq -rR 'fromjson'
  else
    printf '%s\n' "$raw"
  fi
}

extract_resource_specs() {
  local resource_type="$1"
  shift

  local attr_list
  attr_list="$(IFS=,; printf '%s' "$*")"

  awk -v resource_type="$resource_type" -v attr_list="$attr_list" '
    function trim(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }

    BEGIN {
      attr_count = split(attr_list, attrs, ",")
    }

    $0 ~ "^[[:space:]]*resource[[:space:]]+\"" resource_type "\"[[:space:]]+\"" {
      label = $3
      gsub(/"/, "", label)
      in_block = 1
      depth = 1

      for (i = 1; i <= attr_count; i++) {
        values[attrs[i]] = ""
      }

      next
    }

    in_block {
      if (depth == 1) {
        for (i = 1; i <= attr_count; i++) {
          attr = attrs[i]
          line = $0

          if (line ~ "^[[:space:]]*" attr "[[:space:]]*=") {
            sub(/^[^=]*=[[:space:]]*/, "", line)
            values[attr] = trim(line)
          }
        }
      }

      brace_line = $0
      open_count = gsub(/\{/, "{", brace_line)
      close_count = gsub(/\}/, "}", brace_line)
      depth += open_count - close_count

      if (depth == 0) {
        printf "%s.%s", resource_type, label
        for (i = 1; i <= attr_count; i++) {
          printf "\t%s", values[attrs[i]]
        }
        printf "\n"
        in_block = 0
      }
    }
  ' ./*.tf | LC_ALL=C sort
}

list_dns_specs() {
  extract_resource_specs "cloudflare_dns_record" name type content
}

list_ruleset_specs() {
  extract_resource_specs "cloudflare_ruleset" phase account_id zone_id |
    while IFS=$'\t' read -r address phase_expr account_id_expr zone_id_expr; do
      [ -n "$address" ] || continue

      if [ -n "$account_id_expr" ]; then
        printf '%s\taccount\t%s\n' "$address" "$phase_expr"
      else
        printf '%s\tzone\t%s\n' "$address" "$phase_expr"
      fi
    done
}

list_managed_transform_specs() {
  extract_resource_specs "cloudflare_managed_transforms" account_id zone_id |
    while IFS=$'\t' read -r address account_id_expr zone_id_expr; do
      [ -n "$address" ] || continue

      if [ -n "$account_id_expr" ]; then
        printf '%s\taccount\n' "$address"
      else
        printf '%s\tzone\n' "$address"
      fi
    done
}

list_tunnel_specs() {
  extract_resource_specs "cloudflare_zero_trust_tunnel_cloudflared" name
}

list_tunnel_config_specs() {
  extract_resource_specs "cloudflare_zero_trust_tunnel_cloudflared_config" tunnel_id
}

list_access_app_specs() {
  extract_resource_specs "cloudflare_zero_trust_access_application" name
}

list_access_policy_specs() {
  extract_resource_specs "cloudflare_zero_trust_access_policy" name
}

extract_tunnel_address_from_expr() {
  local expr="$1"

  if [[ "$expr" =~ ^cloudflare_zero_trust_tunnel_cloudflared\.([A-Za-z0-9_]+)\.id$ ]]; then
    printf 'cloudflare_zero_trust_tunnel_cloudflared.%s\n' "${BASH_REMATCH[1]}"
  fi
}

cf_error_message() {
  local response="$1"
  local message

  message="$(
    printf '%s' "$response" | jq -r '
      [(.errors[]?.message), (.messages[]?.message)]
      | map(select(. != null and . != ""))
      | join("; ")
    ' 2>/dev/null || true
  )"

  if [ -n "$message" ] && [ "$message" != "null" ]; then
    printf '%s\n' "$message"
  else
    printf '%s\n' "$response"
  fi
}

cf_api() {
  local path="$1"
  local response
  local body

  response="$(
    curl --silent --show-error --retry 3 --retry-all-errors \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -w $'\n%{http_code}' \
      "https://api.cloudflare.com/client/v4${path}"
  )" || return 1

  CF_LAST_STATUS="${response##*$'\n'}"
  body="${response%$'\n'*}"

  if [ "$CF_LAST_STATUS" -ge 400 ]; then
    printf '%s' "$body"
    return 1
  fi

  if ! printf '%s' "$body" | jq -e '.success == true' >/dev/null 2>&1; then
    printf '%s' "$body"
    return 1
  fi

  printf '%s' "$body"
}

fetch_paginated_results() {
  local path="$1"
  local response
  local page=1
  local total_pages=1
  local query_sep="?"
  local tmp_file

  tmp_file="$(mktemp)"
  printf '[]' >"$tmp_file"

  if [[ "$path" == *\?* ]]; then
    query_sep="&"
  fi

  while [ "$page" -le "$total_pages" ]; do
    if ! response="$(cf_api "${path}${query_sep}page=${page}&per_page=100")"; then
      rm -f "$tmp_file"
      die "Cloudflare API request failed for ${path}: $(cf_error_message "$response")"
    fi

    total_pages="$(printf '%s' "$response" | jq -r '.result_info.total_pages // 1')"

    jq -s '.[0] + (.[1] // [])' \
      "$tmp_file" \
      <(printf '%s' "$response" | jq '.result // []') >"${tmp_file}.next"
    mv "${tmp_file}.next" "$tmp_file"

    page=$((page + 1))
  done

  cat "$tmp_file"
  rm -f "$tmp_file"
}

run_import() {
  local address="$1"
  local import_id="$2"

  if state_has "$address"; then
    record_skip "$address already exists in state"
    return 0
  fi

  if [ "$DRY_RUN" = "1" ]; then
    record_skip "[dry-run] terraform import $address $import_id"
    return 0
  fi

  if terraform import -input=false "$address" "$import_id" >/dev/null 2>&1; then
    if [ -n "$STATE_ADDRESSES" ]; then
      STATE_ADDRESSES="${STATE_ADDRESSES}"$'\n'"$address"
    else
      STATE_ADDRESSES="$address"
    fi
    record_import "Imported $address"
    return 0
  fi

  return 1
}

run_import_candidates() {
  local address="$1"
  shift

  if state_has "$address"; then
    record_skip "$address already exists in state"
    return 0
  fi

  while [ "$#" -gt 0 ]; do
    if run_import "$address" "$1"; then
      return 0
    fi
    shift
  done

  record_failure "Failed to import $address"
  return 1
}

import_tunnels() {
  local tunnels_json
  local address
  local name_expr
  local tunnel_name
  local tunnel_id

  info "Importing tunnels..."
  tunnels_json="$(fetch_paginated_results "/accounts/${ACCOUNT_ID}/cfd_tunnel")"

  while IFS=$'\t' read -r address name_expr; do
    [ -n "$address" ] || continue
    tunnel_name="$(terraform_eval_string "$name_expr")"

    tunnel_id="$(
      printf '%s' "$tunnels_json" | jq -r --arg name "$tunnel_name" '
        ([.[] | select(.name == $name) | .id] | first) // empty
      '
    )"

    if [ -z "$tunnel_id" ]; then
      record_skip "No existing tunnel found for $address ($tunnel_name)"
      continue
    fi

    run_import_candidates \
      "$address" \
      "$ACCOUNT_ID/$tunnel_id" \
      "accounts/$ACCOUNT_ID/$tunnel_id" \
      "$tunnel_id"
  done < <(list_tunnel_specs)
}

import_tunnel_configs() {
  local tunnels_json
  local config_address
  local tunnel_id_expr
  local referenced_tunnel
  local tunnel_name_expr
  local tunnel_name
  local tunnel_id

  info "Importing tunnel configs..."
  tunnels_json="$(fetch_paginated_results "/accounts/${ACCOUNT_ID}/cfd_tunnel")"

  while IFS=$'\t' read -r config_address tunnel_id_expr; do
    [ -n "$config_address" ] || continue

    referenced_tunnel="$(extract_tunnel_address_from_expr "$tunnel_id_expr" || true)"
    [ -n "$referenced_tunnel" ] || continue

    tunnel_name_expr="$(
      while IFS=$'\t' read -r tunnel_address name_expr; do
        if [ "$tunnel_address" = "$referenced_tunnel" ]; then
          printf '%s\n' "$name_expr"
          break
        fi
      done < <(list_tunnel_specs)
    )"
    tunnel_name="$(terraform_eval_string "$tunnel_name_expr")"

    tunnel_id="$(
      printf '%s' "$tunnels_json" | jq -r --arg name "$tunnel_name" '
        ([.[] | select(.name == $name and .config_src == "cloudflare") | .id] | first) // empty
      '
    )"

    if [ -z "$tunnel_id" ]; then
      record_skip "No remote-managed tunnel config found for $config_address ($tunnel_name)"
      continue
    fi

    run_import_candidates \
      "$config_address" \
      "$ACCOUNT_ID/$tunnel_id" \
      "accounts/$ACCOUNT_ID/$tunnel_id" \
      "$tunnel_id"
  done < <(list_tunnel_config_specs)
}

import_access_apps() {
  local access_apps_json
  local address
  local name_expr
  local app_name
  local app_id

  info "Importing Access apps..."
  access_apps_json="$(fetch_paginated_results "/accounts/${ACCOUNT_ID}/access/apps")"

  while IFS=$'\t' read -r address name_expr; do
    [ -n "$address" ] || continue
    app_name="$(terraform_eval_string "$name_expr")"

    app_id="$(
      printf '%s' "$access_apps_json" | jq -r --arg name "$app_name" '
        ([.[] | select(.name == $name) | .id] | first) // empty
      '
    )"

    if [ -z "$app_id" ]; then
      record_skip "No existing Access app found for $address ($app_name)"
      continue
    fi

    run_import_candidates \
      "$address" \
      "$ACCOUNT_ID/$app_id" \
      "accounts/$ACCOUNT_ID/$app_id" \
      "$app_id"
  done < <(list_access_app_specs)
}

import_access_policies() {
  local access_policies_json
  local address
  local name_expr
  local policy_name
  local policy_id

  info "Importing Access policies..."
  access_policies_json="$(fetch_paginated_results "/accounts/${ACCOUNT_ID}/access/policies")"

  while IFS=$'\t' read -r address name_expr; do
    [ -n "$address" ] || continue
    policy_name="$(terraform_eval_string "$name_expr")"

    policy_id="$(
      printf '%s' "$access_policies_json" | jq -r --arg name "$policy_name" '
        ([.[] | select(.name == $name) | (.id // .uid)] | first) // empty
      '
    )"

    if [ -z "$policy_id" ]; then
      record_skip "No existing Access policy found for $address ($policy_name)"
      continue
    fi

    run_import_candidates \
      "$address" \
      "$ACCOUNT_ID/$policy_id" \
      "accounts/$ACCOUNT_ID/$policy_id" \
      "$policy_id"
  done < <(list_access_policy_specs)
}

import_dns_records() {
  local dns_records_json
  local address
  local name_expr
  local type_expr
  local content_expr
  local record_name
  local record_type
  local record_content
  local record_id

  info "Importing DNS records..."
  dns_records_json="$(fetch_paginated_results "/zones/${ZONE_ID}/dns_records")"

  while IFS=$'\t' read -r address name_expr type_expr content_expr; do
    [ -n "$address" ] || continue
    record_name="$(terraform_eval_string "$name_expr")"
    record_type="$(terraform_eval_string "$type_expr")"
    record_content="$(terraform_eval_string "$content_expr")"
    record_content="${record_content#\"}"
    record_content="${record_content%\"}"

    if [ "$record_type" = "TXT" ] && [ -n "$record_content" ]; then
      record_id="$(
        printf '%s' "$dns_records_json" | jq -r \
          --arg name "$record_name" \
          --arg type "$record_type" \
          --arg content "$record_content" '
            ([.[] |
              select(
                .name == $name and
                .type == $type and
                ((.content | gsub("^\\\"|\\\"$"; "")) | contains($content))
              ) |
              .id
            ] | first) // empty
          '
      )"
    else
      record_id="$(
        printf '%s' "$dns_records_json" | jq -r \
          --arg name "$record_name" \
          --arg type "$record_type" '
            ([.[] |
              select(.name == $name and .type == $type) |
              .id
            ] | first) // empty
          '
      )"
    fi

    if [ -z "$record_id" ]; then
      record_skip "No DNS record found for $address ($record_type $record_name)"
      continue
    fi

    run_import "$address" "${ZONE_ID}/${record_id}"
  done < <(list_dns_specs)
}

import_rulesets() {
  local address
  local scope
  local phase_expr
  local phase
  local response
  local ruleset_id

  info "Importing rulesets..."

  while IFS=$'\t' read -r address scope phase_expr; do
    [ -n "$address" ] || continue
    phase="$(terraform_eval_string "$phase_expr")"

    if ! response="$(cf_api "/zones/${ZONE_ID}/rulesets/phases/${phase}/entrypoint")"; then
      if [ "$CF_LAST_STATUS" = "404" ]; then
        record_skip "No ruleset found for $address ($phase)"
        continue
      fi

      record_failure "Failed to fetch ruleset for $address ($phase): $(cf_error_message "$response")"
      continue
    fi

    ruleset_id="$(printf '%s' "$response" | jq -r '.result.id // empty')"

    if [ -z "$ruleset_id" ]; then
      record_skip "No ruleset found for $address ($phase)"
      continue
    fi

    run_import "$address" "zones/${ZONE_ID}/${ruleset_id}"
  done < <(list_ruleset_specs)
}

import_managed_transforms() {
  local address
  local scope

  info "Importing managed transforms..."

  while IFS=$'\t' read -r address scope; do
    [ -n "$address" ] || continue
    run_import_candidates \
      "$address" \
      "$ZONE_ID" \
      "zones/$ZONE_ID" \
      "$ZONE_ID/managed_headers" \
      "zones/$ZONE_ID/managed_headers"
  done < <(list_managed_transform_specs)
}

run_plan_check() {
  local plan_exit=0

  if [ "$DRY_RUN" = "1" ]; then
    record_skip "Skipping terraform plan because DRY_RUN=1"
    return 0
  fi

  set +e
  terraform plan -detailed-exitcode -input=false >/dev/null 2>&1
  plan_exit=$?
  set -e

  case "$plan_exit" in
    0)
      info "Terraform is ready. No changes detected."
      ;;
    2)
      info "Bootstrap finished. Review 'terraform plan' and then run 'terraform apply'."
      ;;
    *)
      record_failure "terraform plan failed. Run 'set -a && . ./.env && set +a && terraform plan' manually."
      ;;
  esac
}

main() {
  require_command curl
  require_command jq
  require_command terraform
  require_command sed
  [ -f "$TF_VAR_FILE" ] || die "$TF_VAR_FILE not found."

  load_env
  ensure_terraform_init
  ZONE_ID="$(read_tfvar "zone_id")"
  ACCOUNT_ID="$(read_tfvar "account_id")"
  DOMAIN="$(read_tfvar "domain")"
  refresh_state_addresses

  log
  log "Cloudflare bootstrap import"
  log "=========================="
  info "Domain: $DOMAIN"

  if [ "$DRY_RUN" = "1" ]; then
    warn "DRY_RUN=1 enabled. No imports will be written to state."
  fi

  import_tunnels
  import_tunnel_configs
  import_access_policies
  import_access_apps
  import_dns_records
  import_rulesets
  import_managed_transforms
  run_plan_check

  log
  info "Imported: $IMPORTED_COUNT"
  info "Skipped: $SKIPPED_COUNT"
  info "Failed: $FAILED_COUNT"

  if [ "$FAILED_COUNT" -gt 0 ]; then
    exit 1
  fi
}

main "$@"
