output "selfhost_tunnel_id" {
  description = "ID (UUID) of the self-host tunnel"
  value       = cloudflare_zero_trust_tunnel_cloudflared.selfhost.id
  sensitive   = true
}

output "selfhost_app_hostname" {
  description = "Hostname routed to the self-hosted app"
  value       = local.selfhost_app_hostname
  sensitive   = true
}

output "selfhost_coolify_hostname" {
  description = "Hostname routed to the self-hosted Coolify UI"
  value       = local.selfhost_coolify_hostname
  sensitive   = true
}

output "selfhost_cname_target" {
  description = "CNAME target that points to the tunnel"
  value       = "${cloudflare_zero_trust_tunnel_cloudflared.selfhost.id}.cfargotunnel.com"
  sensitive   = true
}
