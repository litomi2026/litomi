resource "cloudflare_zero_trust_access_application" "argocd" {
  account_id = var.account_id

  name = "Litomi Internal Apps"
  type = "self_hosted"

  destinations = [
    { uri = local.selfhost_argocd_hostname },
    { uri = local.selfhost_grafana_hostname },
    { uri = local.selfhost_stg_hostname },
  ]

  session_duration          = "160h"
  auto_redirect_to_identity = true

  policies = [
    {
      name       = "Allow"
      decision   = "allow"
      precedence = 1

      include = length(var.access_allowed_emails) > 0 ? [
        for email in var.access_allowed_emails : {
          email = { email = email }
        }
      ] : [{ everyone = {} }]
    }
  ]
}
