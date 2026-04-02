#!/usr/bin/env bash
# shellcheck shell=bash

declare -ra VAULT_CA_NAMESPACES=(
  "argocd"
  "litomi-prod"
  "litomi-stg"
  "cloudflared"
  "gtm-server"
  "monitoring"
  "velero"
  "minio"
  "logging"
  "tracing"
)

declare -ra VAULT_POLICY_SPECS=(
  "argocd-read|argocd"
  "litomi-prod-read|litomi-prod"
  "litomi-stg-read|litomi-stg"
  "cloudflared-read|cloudflared"
  "gtm-server-read|gtm-server"
  "monitoring-read|monitoring"
  "velero-read|velero"
  "minio-read|minio"
)

declare -ra VAULT_ROLE_SPECS=(
  "eso-argocd|argocd|argocd-read"
  "eso-litomi-prod|litomi-prod|litomi-prod-read"
  "eso-litomi-stg|litomi-stg|litomi-stg-read"
  "eso-cloudflared|cloudflared|cloudflared-read"
  "eso-gtm-server|gtm-server|gtm-server-read"
  "eso-monitoring|monitoring|monitoring-read"
  "eso-velero|velero|velero-read"
  "eso-minio|minio|minio-read"
  "eso-logging|logging|minio-read"
  "eso-tracing|tracing|minio-read"
)

declare -ra REQUIRED_SEED_FILES=(
  "argocd/github-repo-creds.env"
  "litomi-prod/litomi-backend-secret.env"
  "litomi-stg/litomi-backend-secret.env"
  "cloudflared/cloudflared-token.env"
  "gtm-server/gtm-server-secret.env"
  "monitoring/grafana-admin.env"
  "monitoring/alertmanager-discord-webhook-warning.env"
  "monitoring/alertmanager-discord-webhook-critical.env"
  "velero/velero-cloud-credentials.env"
  "minio/minio-root.env"
)

declare -ra REQUIRED_CLUSTER_SECRETS=(
  "argocd|github-repo-creds"
  "litomi-prod|litomi-backend-secret"
  "litomi-stg|litomi-backend-secret"
  "cloudflared|cloudflared-token"
  "gtm-server|gtm-server-secret"
  "monitoring|grafana-admin"
  "monitoring|alertmanager-discord-webhook-warning"
  "monitoring|alertmanager-discord-webhook-critical"
  "velero|velero-cloud-credentials"
  "minio|minio-env-configuration"
  "logging|loki-minio"
  "tracing|tempo-minio"
)
