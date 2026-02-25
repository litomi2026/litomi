#!/usr/bin/env bash
# shellcheck shell=bash

force_reconcile_resource() {
  local resource="$1"
  local stamp
  local lines
  local ns
  local name

  stamp="$(date +%s)"
  lines="$(k get "$resource" -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
  [[ -n "$lines" ]] || return

  while IFS=$'\t' read -r ns name; do
    [[ -z "$ns" || -z "$name" ]] && continue
    k -n "$ns" annotate "$resource" "$name" litomi.dev/reconcile-ts="$stamp" --overwrite >/dev/null 2>&1 || true
  done <<< "$lines"
}

force_refresh_argocd_apps() {
  local app
  local apps

  apps="$(k -n argocd get applications.argoproj.io -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
  [[ -n "$apps" ]] || return

  while IFS= read -r app; do
    [[ -z "$app" ]] && continue
    k -n argocd annotate applications.argoproj.io "$app" argocd.argoproj.io/refresh=hard --overwrite >/dev/null 2>&1 || true
  done <<< "$apps"
}

force_sync_out_of_sync_argocd_apps() {
  local lines
  local app
  local sync
  local _health
  local phase

  lines="$(k -n argocd get applications.argoproj.io -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.sync.status}{"\t"}{.status.health.status}{"\t"}{.status.operationState.phase}{"\n"}{end}' 2>/dev/null || true)"
  [[ -n "$lines" ]] || return

  while IFS=$'\t' read -r app sync _health phase; do
    [[ -z "$app" ]] && continue
    if [[ "$sync" == "Synced" && "$phase" != "Failed" ]]; then
      continue
    fi
    if [[ "$phase" == "Running" ]]; then
      continue
    fi
    k -n argocd patch applications.argoproj.io "$app" --type merge \
      -p '{"operation":{"initiatedBy":{"username":"platform-ops"},"sync":{"prune":true}}}' >/dev/null 2>&1 || true
  done <<< "$lines"
}

run_reconcile_actions() {
  force_reconcile_resource secretstores.external-secrets.io
  force_reconcile_resource externalsecrets.external-secrets.io
  force_refresh_argocd_apps
  force_sync_out_of_sync_argocd_apps
  ok "reconcile annotations applied"
}
