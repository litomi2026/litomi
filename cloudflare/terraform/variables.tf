variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "Domain name"
  type        = string
}
