#!/usr/bin/env bash
# shellcheck shell=bash

request_argocd_app_refresh() {
  local app="${1:-}"
  local refresh_type="${2:-normal}"

  [[ -n "$app" ]] || return

  case "$refresh_type" in
    normal|hard)
      ;;
    *)
      refresh_type="normal"
      ;;
  esac

  k -n argocd annotate applications.argoproj.io "$app" "argocd.argoproj.io/refresh=${refresh_type}" --overwrite >/dev/null 2>&1 || true
}

list_argocd_app_status_lines() {
  k -n argocd get applications.argoproj.io \
    -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.sync.status}{"\t"}{.status.health.status}{"\t"}{.status.operationState.phase}{"\n"}{end}' 2>/dev/null || true
}

request_refresh_for_argocd_apps_needing_attention() {
  local lines
  local app
  local sync
  local health
  local phase

  lines="$(list_argocd_app_status_lines)"
  [[ -n "$lines" ]] || return

  while IFS=$'\t' read -r app sync health phase; do
    [[ -z "$app" ]] && continue
    if [[ "$sync" == "Synced" && "$health" == "Healthy" && "$phase" != "Failed" ]]; then
      continue
    fi
    if [[ "$phase" == "Running" ]]; then
      continue
    fi

    request_argocd_app_refresh "$app"
  done <<< "$lines"
}

build_argocd_sync_options_json() {
  local app="$1"
  local sync_options_json

  sync_options_json="$(k -n argocd get applications.argoproj.io "$app" -o jsonpath='{.spec.syncPolicy.syncOptions}' 2>/dev/null || true)"
  if [[ -z "$sync_options_json" || "$sync_options_json" == "<no value>" || "$sync_options_json" == "null" ]]; then
    sync_options_json='[]'
  fi
  printf '%s' "$sync_options_json"
}

build_argocd_sync_patch_payload() {
  local app="$1"
  local prune
  local sync_options_json

  prune="$(k -n argocd get applications.argoproj.io "$app" -o jsonpath='{.spec.syncPolicy.automated.prune}' 2>/dev/null || true)"
  if [[ "$prune" != "true" ]]; then
    prune="false"
  fi

  sync_options_json="$(build_argocd_sync_options_json "$app")"
  printf '{"operation":{"initiatedBy":{"username":"platform-ops"},"sync":{"prune":%s,"syncOptions":%s}}}' "$prune" "$sync_options_json"
}

force_sync_out_of_sync_argocd_apps() {
  local lines
  local app
  local sync
  local _health
  local phase
  local payload

  lines="$(list_argocd_app_status_lines)"
  [[ -n "$lines" ]] || return

  while IFS=$'\t' read -r app sync _health phase; do
    [[ -z "$app" ]] && continue
    if [[ "$sync" == "Synced" && "$phase" != "Failed" ]]; then
      continue
    fi
    if [[ "$phase" == "Running" ]]; then
      continue
    fi

    payload="$(build_argocd_sync_patch_payload "$app")"
    k -n argocd patch applications.argoproj.io "$app" --type merge -p "$payload" >/dev/null 2>&1 || true
  done <<< "$lines"
}

run_reconcile_actions() {
  # Keep Git-managed ESO resources immutable at runtime to avoid Argo CD drift.
  # Vault changes are picked up via each ExternalSecret's periodic refresh interval.
  # A one-shot root refresh is enough to pick up declarative changes after bootstrap/seeding.
  # Repeating hard refreshes across every app turns into an expensive manifest-generation loop.
  request_argocd_app_refresh root
  request_refresh_for_argocd_apps_needing_attention
  force_sync_out_of_sync_argocd_apps
  ok "Argo CD reconciliation nudged"
}
