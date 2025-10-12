resource "cloudflare_ruleset" "cache_rules" {
  zone_id = "<ZONE_ID>"
  name    = "Cache Rules"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [{
    ref         = "cache_settings_custom_cache_key"
    description = "Respect origin cache-control header (json only)"
    expression  = "(http.request.uri.path.extension in {\"json\" \"webmanifest\"}) or (starts_with(http.request.uri.path, \"/api\"))"
    action      = "set_cache_settings"

    action_parameters = {
      edge_ttl = {
        mode = "respect_origin"
      }
      browser_ttl = {
        mode = "respect_origin"
      }
    }
  }]
}
