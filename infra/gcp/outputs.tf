output "workload_identity_provider" {
  description = "GitHub repo var GCP_WORKLOAD_IDENTITY_PROVIDER 값(프로젝트 번호 포함 전체 리소스 이름)."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deploy_service_account" {
  description = "GitHub repo var GCP_DEPLOY_SERVICE_ACCOUNT 값(배포 SA 이메일)."
  value       = google_service_account.deployer.email
}

output "project_id" {
  description = "GitHub repo var GCP_PROJECT_ID 값."
  value       = var.project_id
}
