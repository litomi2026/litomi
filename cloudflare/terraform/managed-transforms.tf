data "cloudflare_managed_transforms" "current" {
  zone_id = var.zone_id
}

locals {
  managed_request_headers_overrides = {
    add_visitor_location_headers = true
  }

  managed_response_headers_overrides = {
    remove_x-powered-by_header = true
  }

  managed_request_headers = toset([
    for transform in data.cloudflare_managed_transforms.current.managed_request_headers : {
      id      = transform.id
      enabled = lookup(local.managed_request_headers_overrides, transform.id, transform.enabled)
    }
  ])

  managed_response_headers = toset([
    for transform in data.cloudflare_managed_transforms.current.managed_response_headers : {
      id      = transform.id
      enabled = lookup(local.managed_response_headers_overrides, transform.id, transform.enabled)
    }
  ])
}

resource "cloudflare_managed_transforms" "managed_transforms" {
  zone_id = var.zone_id

  managed_request_headers  = local.managed_request_headers
  managed_response_headers = local.managed_response_headers
}
