output "cache_rules_count" {
  description = "Number of cache rules configured"
  value       = length(cloudflare_ruleset.cache_rules.rules)
}

output "rate_limiting_rules_count" {
  description = "Number of rate limiting rules configured"
  value       = length(cloudflare_ruleset.rate_limiting.rules)
}
