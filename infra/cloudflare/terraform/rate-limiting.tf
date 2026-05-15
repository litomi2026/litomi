resource "cloudflare_ruleset" "rate_limiting" {
  zone_id = var.zone_id
  name    = "default"
  kind    = "zone"
  phase   = "http_ratelimit"

  rules = [
    {
      ref         = "rate_limit"
      enabled     = true
      description = "Rate limit"
      expression  = "(starts_with(http.request.uri.path, \"/\") and not starts_with(http.request.uri.path, \"/cdn-cgi/challenge-platform/\") and not starts_with(http.request.uri.path, \"/.well-known/\") and not http.request.uri.path contains \".\")"
      action      = "block"

      ratelimit = {
        characteristics     = ["cf.colo.id", "ip.src"] # cf.colo.id required for free tier
        period              = var.rate_limit_period
        requests_per_period = var.rate_limit_requests
        mitigation_timeout  = var.rate_limit_timeout
      }
    }
  ]
}
