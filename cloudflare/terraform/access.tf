resource "cloudflare_zero_trust_access_application" "argocd" {
  account_id = var.account_id

  name   = "Argo CD"
  domain = local.selfhost_argocd_hostname
  type   = "self_hosted"

  session_duration          = "18h"
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
