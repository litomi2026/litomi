locals {
  cached_path_equals = [
    "/deterrence",
    "/doc/privacy",
    "/doc/terms",
    "/auth/login",
    "/auth/signup",
    "/@",
    "/manga",
    "/404",
  ]

  cached_path_prefixes = [
    "/@/",
    "/manga/"
  ]

  exact_path_conditions = join(" or ", [
    for path in local.cached_path_equals :
    "(http.request.uri.path eq \"${path}\")"
  ])

  prefix_path_conditions = join(" or ", [
    for prefix in local.cached_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  static_pages_expression = "${local.exact_path_conditions} or ${local.prefix_path_conditions}"
}

resource "cloudflare_ruleset" "cache_rules" {
  zone_id = var.zone_id
  name    = "Cache Rules"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [
    {
      ref         = "respect_origin_cache_control"
      enabled     = true
      description = "Respect origin cache-control (json, webmanifest, api)"
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
        cache_key = {
          cache_deception_armor      = true
          ignore_query_strings_order = true
        }
      }
    },
    {
      ref         = "manga_pages_html"
      enabled     = true
      description = "Override cache for static pages"
      expression  = local.static_pages_expression
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 2592000 # 30 days
        }
        browser_ttl = {
          mode = "respect_origin"
        }
        cache_key = {
          cache_deception_armor      = true
          ignore_query_strings_order = true
        }
      }
    },
    {
      ref         = "r2_storage"
      enabled     = true
      description = "Override cache for R2 storage"
      expression  = "(http.host eq \"r2.litomi.in\")"
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 31536000
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 43200
        }
        cache_key = {
          cache_deception_armor      = true
          ignore_query_strings_order = true
        }
      }
    }
  ]
}
