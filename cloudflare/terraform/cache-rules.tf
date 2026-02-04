locals {
  respect_origin_prefixes = [
    "/api/",
  ]

  ttl_30d_path_equals = [
    "/",
    "/app", // app 으로 시작하는 것과 겹칠까봐
    "/chat",
    "/library",
    "/@",
  ]

  ttl_30d_extension_equals = [
    "webmanifest",
  ]

  ttl_30d_path_prefixes = [
    "/_next/image",
    "/_not-found",
    "/auth/",
    "/app.",
    "/apple-",
    "/deterrence",
    "/doc/",
    "/favicon.",
    "/icon.",
    "/image/",
    "/libo",
    "/manga",
    "/nye",
    "/notification",
    "/offline.html",
    "/og-image.",
    "/posts/",
    "/random",
    "/realtime",
    "/search",
    "/tag",
    "/webtoon",
    "/web-app-manifest",
    "/404",
    "/@/",
  ]

  ttl_day_path_prefixes = [
    "/ranking/",
    "/robots.txt",
    "/sitemap.xml",
  ]

  ttl_3h_path_prefixes = [
    "/new/",
  ]

  ttl_10s_path_equals = [
    "_________",
  ]

  bypass_cache_path_prefixes = [
    "/.well-known/",
    "/@",
    "/cdn-cgi/challenge-platform/",
  ]

  bypass_cache_hostnames = [
    local.selfhost_coolify_hostname,
  ]

  respect_origin_conditions = join(" or ", [
    for prefix in local.respect_origin_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  exact_path_conditions = join(" or ", [
    for path in local.ttl_30d_path_equals :
    "(http.request.uri.path eq \"${path}\")"
  ])

  exact_extension_conditions = join(" ", [
    for extension in local.ttl_30d_extension_equals :
    "\"${extension}\""
  ])

  prefix_path_conditions = join(" or ", [
    for prefix in local.ttl_30d_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  ttl_day_conditions = join(" or ", [
    for prefix in local.ttl_day_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  ttl_3h_conditions = join(" or ", [
    for prefix in local.ttl_3h_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  ttl_10s_conditions = join(" or ", [
    for path in local.ttl_10s_path_equals :
    "(http.request.uri.path eq \"${path}\")"
  ])

  bypass_cache_conditions = join(" or ", [
    for prefix in local.bypass_cache_path_prefixes :
    "(starts_with(http.request.uri.path, \"${prefix}\"))"
  ])

  bypass_cache_host_conditions = join(" or ", [
    for hostname in local.bypass_cache_hostnames :
    "(http.host eq \"${hostname}\")"
  ])

  ttl_30d_expression = "${local.exact_path_conditions} or ${local.prefix_path_conditions} or (http.request.uri.path.extension in {${local.exact_extension_conditions}})"
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
      description = "Respect origin cache-control"
      expression  = local.respect_origin_conditions
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
      description = "Cache with 30 days TTL"
      expression  = local.ttl_30d_expression
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
      ref         = "isr_day"
      enabled     = true
      description = "Cache with 1 day TTL"
      expression  = local.ttl_day_conditions
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
      ref         = "isr_hour"
      enabled     = true
      description = "Cache with 3 hours TTL"
      expression  = local.ttl_3h_conditions
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 10800 # 3 hours
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
      ref         = "ttl_10s"
      enabled     = true
      description = "Cache with 10 seconds TTL"
      expression  = local.ttl_10s_conditions
      action      = "set_cache_settings"

      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 10 # 10 seconds
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
    },
    {
      ref         = "bypass_cache"
      enabled     = true
      description = "Bypass cache for paths or hostnames"
      expression  = "(${local.bypass_cache_conditions}) or (${local.bypass_cache_host_conditions})"
      action      = "set_cache_settings"

      action_parameters = {
        cache = false
      }
    },
  ]
}
