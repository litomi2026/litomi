locals {
  selfhost_tunnel_name       = "litomi-selfhost"
  selfhost_origin_service    = "http://traefik.kube-system.svc.cluster.local:80"
  selfhost_prod_hostname     = var.domain
  selfhost_prod_api_hostname = "api.${var.domain}"
  selfhost_stg_hostname      = "stg.${var.domain}"
  selfhost_stg_api_hostname  = "api-stg.${var.domain}"
  selfhost_grafana_hostname  = "grafana.${var.domain}"
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
        hostname = local.selfhost_prod_hostname
        service  = local.selfhost_origin_service
      },
      {
        hostname = local.selfhost_prod_api_hostname
        service  = local.selfhost_origin_service
      },
      {
        hostname = local.selfhost_stg_hostname
        service  = local.selfhost_origin_service
      },
      {
        hostname = local.selfhost_stg_api_hostname
        service  = local.selfhost_origin_service
      },
      {
        hostname = local.selfhost_grafana_hostname
        service  = local.selfhost_origin_service
      },
      {
        service = "http_status:404"
      }
    ]
  }
}
