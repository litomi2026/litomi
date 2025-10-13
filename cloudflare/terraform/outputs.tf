output "cache_ruleset_id" {
  description = "ID of the cache ruleset"
  value       = cloudflare_ruleset.cache_rules.id
}

output "cache_ruleset_name" {
  description = "Name of the cache ruleset"
  value       = cloudflare_ruleset.cache_rules.name
}

output "cache_rules_count" {
  description = "Number of cache rules configured"
  value       = length(cloudflare_ruleset.cache_rules.rules)
}

output "rate_limiting_ruleset_id" {
  description = "ID of the rate limiting ruleset"
  value       = cloudflare_ruleset.rate_limiting.id
}

output "rate_limiting_ruleset_name" {
  description = "Name of the rate limiting ruleset"
  value       = cloudflare_ruleset.rate_limiting.name
}

output "rate_limiting_rules_count" {
  description = "Number of rate limiting rules configured"
  value       = length(cloudflare_ruleset.rate_limiting.rules)
}
