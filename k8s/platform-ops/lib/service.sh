#!/usr/bin/env bash
# shellcheck shell=bash

install_or_update_reboot_service() {
  assert_command_exists systemctl

  local tmp_file
  tmp_file="$(mktemp)"

  cat >"$tmp_file" <<EOF_SERVICE
[Unit]
Description=Litomi platform reboot reconciliation
Wants=network-online.target
After=network-online.target k3s.service

[Service]
Type=oneshot
User=root
WorkingDirectory=${REPO_ROOT}
Environment="KUBECTL_CMD=kubectl"
Environment="VAULT_INIT_OUTPUT=${VAULT_INIT_OUTPUT}"
Environment="VAULT_ADDR=${VAULT_ADDR}"
Environment="VAULT_CACERT=${VAULT_CACERT}"
Environment="VAULT_SECRETS_DIR=${VAULT_SECRETS_DIR}"
Environment="K3S_KUBELET_NODE_IP=${K3S_KUBELET_NODE_IP}"
ExecStart=${SCRIPT_PATH} --skip-public-check
TimeoutStartSec=1800
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF_SERVICE

  run_root_quiet install -m 644 "$tmp_file" "$SERVICE_UNIT_PATH"
  rm -f "$tmp_file"

  run_root_quiet systemctl daemon-reload
  run_root_quiet systemctl enable "$SERVICE_NAME"
  # Do not block init completion on reboot service execution.
  if ! run_root_quiet_or_return systemctl restart --no-block "$SERVICE_NAME"; then
    warn "failed to restart ${SERVICE_NAME}; continue without blocking"
  fi
  ok "reboot service installed/enabled: ${SERVICE_NAME}"
}
