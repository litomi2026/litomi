output "cache_ruleset_id" {
  description = "ID of the cache ruleset"
  value       = cloudflare_ruleset.cache_rules.id
}

output "cache_ruleset_name" {
  description = "Name of the cache ruleset"
  value       = cloudflare_ruleset.cache_rules.name
}
