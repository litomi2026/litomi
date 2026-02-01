resource "cloudflare_ruleset" "www_redirect" {
  zone_id     = var.zone_id
  name        = "WWW Redirect"
  description = "Redirect www to root"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules = [
    {
      action = "redirect"
      action_parameters = {
        from_value = {
          status_code = 301
          target_url = {
            expression = "concat(\"https://${var.domain}\", http.request.uri.path)"
          }
          preserve_query_string = true
        }
      }
      expression  = "http.host eq \"www.${var.domain}\""
      description = "Redirect www to root"
      enabled     = true
    }
  ]
}
