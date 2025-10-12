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
