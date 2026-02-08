resource "cloudflare_dns_record" "root_a" {
  for_each = toset([
    "216.239.32.21",
    "216.239.34.21",
    "216.239.36.21",
    "216.239.38.21"
  ])

  zone_id = var.zone_id
  name    = var.domain
  type    = "A"
  content = each.value
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "root_aaaa" {
  for_each = toset([
    "2001:4860:4802:32::15",
    "2001:4860:4802:34::15",
    "2001:4860:4802:36::15",
    "2001:4860:4802:38::15"
  ])

  zone_id = var.zone_id
  name    = var.domain
  type    = "AAAA"
  content = each.value
  ttl     = 1
  proxied = true
}

# resource "cloudflare_dns_record" "selfhost_root_cname" {
#   zone_id = var.zone_id
#   name    = var.domain
#   type    = "CNAME"
#   content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
#   ttl     = 1
#   proxied = true
# }

resource "cloudflare_dns_record" "www_cname" {
  zone_id = var.zone_id
  name    = "www.litomi.in"
  type    = "CNAME"
  # content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  content = "ghs.googlehosted.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "api_cname" {
  zone_id = var.zone_id
  name    = "api.litomi.in"
  type    = "CNAME"
  # content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  content = "ghs.googlehosted.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "stg_cname" {
  zone_id = var.zone_id
  name    = "stg.litomi.in"
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "api_stg_cname" {
  zone_id = var.zone_id
  name    = "api-stg.litomi.in"
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "r2_cname" {
  zone_id = var.zone_id
  name    = "r2.litomi.in"
  type    = "CNAME"
  content = "public.r2.dev"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "render_cname" {
  zone_id = var.zone_id
  name    = "render.litomi.in"
  type    = "CNAME"
  content = "litomi.onrender.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "render_stg_cname" {
  zone_id = var.zone_id
  name    = "render-stg.litomi.in"
  type    = "CNAME"
  content = "litomi-stage.onrender.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "vercel_cname" {
  zone_id = var.zone_id
  name    = "vercel.litomi.in"
  type    = "CNAME"
  content = "cname.vercel-dns.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "vercel_stg_cname" {
  zone_id = var.zone_id
  name    = "vercel-stg.litomi.in"
  type    = "CNAME"
  content = "bc90fad8422c6ce5.vercel-dns-017.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "netlify_cname" {
  zone_id = var.zone_id
  name    = "netlify.litomi.in"
  type    = "CNAME"
  content = "litomi-proxy.netlify.app"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "selfhost_grafana_cname" {
  zone_id = var.zone_id
  name    = local.selfhost_grafana_hostname
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "selfhost_argocd_cname" {
  zone_id = var.zone_id
  name    = local.selfhost_argocd_hostname
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  ttl     = 1
  proxied = true
}

# ---------------- 기타 DNS 레코드 ----------------

resource "cloudflare_dns_record" "caa" {
  zone_id = var.zone_id
  name    = "litomi.in"
  type    = "CAA"
  ttl     = 1
  proxied = false

  data = {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }
}

resource "cloudflare_dns_record" "dmarc_txt" {
  zone_id = var.zone_id
  name    = "_dmarc.litomi.in"
  type    = "TXT"
  content = "\"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:2f5f6900562c4b2b93de27531f70eb4e@dmarc-reports.cloudflare.net;\""
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "domainkey_txt" {
  zone_id = var.zone_id
  name    = "*._domainkey.litomi.in"
  type    = "TXT"
  content = "\"v=DKIM1; p=\""
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "spf_txt" {
  zone_id = var.zone_id
  name    = "litomi.in"
  type    = "TXT"
  content = "\"v=spf1 -all\""
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "google_verification_txt" {
  zone_id = var.zone_id
  name    = "litomi.in"
  type    = "TXT"
  content = "\"google-site-verification=E8dCRgQMvY3hE4oaZ-vsuhopmTS7qyQG-O5WIMdVenA\""
  ttl     = 3600
  proxied = false
}
