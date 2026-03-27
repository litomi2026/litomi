locals {
  internal_apps_session_duration = "160h"
}

resource "cloudflare_zero_trust_access_policy" "internal_apps_allow" {
  account_id       = var.account_id
  name             = "Litomi Internal Apps Allow"
  decision         = "allow"
  session_duration = local.internal_apps_session_duration

  include = length(var.access_allowed_emails) > 0 ? [
    for email in var.access_allowed_emails : {
      email = { email = email }
    }
  ] : [{ everyone = {} }]
}

resource "cloudflare_zero_trust_access_application" "argocd" {
  account_id = var.account_id

  name = "Litomi Internal Apps"
  type = "self_hosted"

  destinations = [
    { uri = local.selfhost_argocd_hostname },
    { uri = local.selfhost_grafana_hostname },
    { uri = local.selfhost_stg_hostname },
    { uri = local.selfhost_stg_api_hostname },
    { uri = local.selfhost_stg_img_hostname },
  ]

  session_duration          = local.internal_apps_session_duration
  auto_redirect_to_identity = true
  options_preflight_bypass  = true
  enable_binding_cookie     = true

  policies = [
    {
      precedence = 1
      id         = cloudflare_zero_trust_access_policy.internal_apps_allow.id
    }
  ]
}
