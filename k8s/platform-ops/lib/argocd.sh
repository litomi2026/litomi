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

ensure_argocd_bootstrap_and_control_plane() {
  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/argocd/kustomization.yaml"
  assert_file_exists "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"

  k_quiet apply --server-side --force-conflicts -k "${REPO_ROOT}/k8s/bootstrap/argocd"
  k_quiet apply -f "${REPO_ROOT}/k8s/bootstrap/root/root.yaml"
  ok "Argo CD bootstrap and root app applied"

  ensure_argocd_cm_labels

  wait_for_resource argocd deployment argocd-repo-server
  wait_for_resource argocd statefulset argocd-application-controller

  log "waiting rollout: argocd/deployment argocd-repo-server"
  if ! k_quiet_or_return -n argocd rollout status deployment/argocd-repo-server --timeout="${BOOT_WAIT_SECONDS}s"; then
    k -n argocd get pods -o wide || true
    k -n argocd describe deployment/argocd-repo-server || true
    die "argocd-repo-server rollout failed"
  fi
  ok "argocd-repo-server rollout complete"

  log "waiting rollout: argocd/statefulset argocd-application-controller"
  if ! k_quiet_or_return -n argocd rollout status statefulset/argocd-application-controller --timeout="${BOOT_WAIT_SECONDS}s"; then
    k -n argocd get pods -o wide || true
    k -n argocd describe statefulset/argocd-application-controller || true
    die "argocd-application-controller rollout failed"
  fi
  ok "argocd-application-controller rollout complete"

  wait_for_resource argocd applications.argoproj.io root
  wait_for_root_app_synced_healthy
}
