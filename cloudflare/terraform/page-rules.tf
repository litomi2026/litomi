resource "cloudflare_page_rule" "img_proxy_ignore_query_string" {
  zone_id  = var.zone_id
  target   = "img.${var.domain}/i/*"
  priority = 1
  status   = "active"

  actions = {
    # simplified == ignore query string cache level
    cache_level           = "simplified"
    edge_cache_ttl        = 2419200 # 28 days (page rule max)
    cache_deception_armor = "on"
  }
}

resource "cloudflare_page_rule" "img_stg_proxy_ignore_query_string" {
  zone_id  = var.zone_id
  target   = "img-stg.${var.domain}/i/*"
  priority = 2
  status   = "active"

  actions = {
    # simplified == ignore query string cache level
    cache_level           = "simplified"
    edge_cache_ttl        = 2419200 # 28 days (page rule max)
    cache_deception_armor = "on"
  }
}
