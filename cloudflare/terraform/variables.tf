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
  sensitive   = true
}

variable "rate_limit_period" {
  description = "The period in seconds for rate limiting"
  type        = number
  sensitive   = true
}

variable "rate_limit_requests" {
  description = "Maximum number of requests allowed per period"
  type        = number
  sensitive   = true
}

variable "rate_limit_timeout" {
  description = "Mitigation timeout in seconds when rate limit is exceeded"
  type        = number
  sensitive   = true
}

variable "access_allowed_emails" {
  description = "Allowed emails for Cloudflare Access protected apps. Empty list means allow any authenticated identity."
  type        = list(string)
  default     = []
}
