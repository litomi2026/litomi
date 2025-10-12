resource "cloudflare_ruleset" "cache_rules" {
  zone_id = var.zone_id
  name    = "Cache Rules"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [
    {
      ref         = "respect_origin_cache_control"
      enabled     = true
      description = "Respect origin cache-control header (json only)"
      expression  = "(http.request.uri.path.extension in {\"json\" \"webmanifest\"}) or (starts_with(http.request.uri.path, \"/api\"))"
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode = "respect_origin"
        }
        browser_ttl = {
          mode = "respect_origin"
        }
      }
    },
    {
      ref         = "manga_pages_html"
      enabled     = true
      description = "Cache manga viewer HTML pages"
      expression  = "(starts_with(http.request.uri.path, \"/manga/\") and not http.request.uri.path contains \".\" and not http.request.uri.path contains \"/detail\")"
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 2592000 # 30 days
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 3600 # 1 hour
        }
      }
    }
  ]
}
