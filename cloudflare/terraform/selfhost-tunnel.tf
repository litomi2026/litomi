locals {
  selfhost_tunnel_name      = "litomi-selfhost"
  selfhost_app_hostname     = "local.${var.domain}"
  selfhost_api_hostname     = "api-local.${var.domain}"
  selfhost_grafana_hostname = "grafana.${var.domain}"
  selfhost_stg_hostname     = "stg.${var.domain}"
  selfhost_api_stg_hostname = "api-stg.${var.domain}"
  selfhost_coolify_hostname = "coolify.${var.domain}"
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "selfhost" {
  account_id = var.account_id
  name       = local.selfhost_tunnel_name
  config_src = "cloudflare"
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "selfhost" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.selfhost.id

  config = {
    ingress = [
      {
        hostname = local.selfhost_app_hostname
        service  = "http://127.0.0.1:80"
      },
      {
        hostname = local.selfhost_api_hostname
        service  = "http://127.0.0.1:80"
      },
      {
        hostname = local.selfhost_stg_hostname
        service  = "http://127.0.0.1:80"
      },
      {
        hostname = local.selfhost_api_stg_hostname
        service  = "http://127.0.0.1:80"
      },
      {
        hostname = local.selfhost_coolify_hostname
        service  = "http://127.0.0.1:80"
      },
      {
        hostname = local.selfhost_grafana_hostname
        service  = "http://127.0.0.1:80"
      },
      {
        service = "http_status:404"
      }
    ]
  }
}
