resource "cloudflare_managed_transforms" "managed_transforms" {
  zone_id = var.zone_id

  managed_request_headers = [
    {
      id      = "add_visitor_location_headers"
      enabled = true
    },
  ]

  managed_response_headers = [
    {
      id      = "remove_x-powered-by_header"
      enabled = true
    },
  ]
}
