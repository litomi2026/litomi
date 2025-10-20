resource "cloudflare_dns_record" "wildcard_a" {
  zone_id = var.zone_id
  name    = "*.litomi.in"
  type    = "A"
  content = "76.76.21.21"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "root_a" {
  zone_id = var.zone_id
  name    = "litomi.in"
  type    = "A"
  content = "76.76.21.21"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "www_cname" {
  zone_id = var.zone_id
  name    = "www.litomi.in"
  type    = "CNAME"
  content = "cname.vercel-dns.com"
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

resource "cloudflare_dns_record" "api_stage_tunnel" {
  zone_id = var.zone_id
  name    = "api-stage.litomi.in"
  type    = "CNAME"
  content = "ghs.googlehosted.com"
  ttl     = 1
  proxied = true
  comment = "Stage API"
}

resource "cloudflare_dns_record" "api_prod_tunnel" {
  zone_id = var.zone_id
  name    = "api.litomi.in"
  type    = "CNAME"
  content = "ghs.googlehosted.com"
  ttl     = 1
  proxied = true
  comment = "Production API"
}
