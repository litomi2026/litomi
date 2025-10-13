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
      description = "Cache static HTML pages"
      expression  = "(http.request.uri.path eq \"/\") or (http.request.uri.path eq \"/deterrence\") or (http.request.uri.path eq \"/doc/privacy\") or (http.request.uri.path eq \"/doc/terms\") or (http.request.uri.path eq \"/auth/login\") or (http.request.uri.path eq \"/auth/signup\") or (http.request.uri.path eq \"/@\") or (starts_with(http.request.uri.path, \"/@/\") and not http.request.uri.path contains \".\") or (starts_with(http.request.uri.path, \"/manga/\") and not http.request.uri.path contains \".\")"
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
