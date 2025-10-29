locals {
  cached_path_equals = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/deterrence",
    "/doc/privacy",
    "/doc/terms",
    "/manga",
    "/new",
    "/offline.html",
    "/404",
    "/@",
  ]

  cached_extension_equals = [
    "json",
    "webmanifest",
  ]

  cached_path_prefixes = [
    "/@/",
    "/manga/",
    "/favicon",
    "/web-app-manifest",
  ]

  isr_hour_path_prefixes = [
    "/new/",
  ]

  isr_day_path_prefixes = [
    "/ranking/",
  ]

  isr_hour_conditions = join(" or ", [
    for prefix in local.isr_hour_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  isr_day_conditions = join(" or ", [
    for prefix in local.isr_day_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  exact_path_conditions = join(" or ", [
    for path in local.cached_path_equals :
    "(http.request.uri.path eq \"${path}\")"
  ])

  exact_extension_conditions = join(" ", [
    for extension in local.cached_extension_equals :
    "\"${extension}\""
  ])

  prefix_path_conditions = join(" or ", [
    for prefix in local.cached_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  static_pages_expression = "${local.exact_path_conditions} or ${local.prefix_path_conditions} or (http.request.uri.path.extension in {${local.exact_extension_conditions}})"
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
      description = "Respect origin cache-control (api)"
      expression  = "(starts_with(http.request.uri.path, \"/api\"))"
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
      ref         = "isr_hour"
      enabled     = true
      description = "ISR cache with 1 hour revalidation"
      expression  = local.isr_hour_conditions
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 3600 # 1 hour
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
      ref         = "isr_day"
      enabled     = true
      description = "ISR cache with 1 day revalidation"
      expression  = local.isr_day_conditions
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 86400 # 1 day
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
          default = 31536000 # 1 year
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 86400 # 1 day
        }
        cache_key = {
          cache_deception_armor      = true
          ignore_query_strings_order = true
        }
      }
    }
  ]
}
