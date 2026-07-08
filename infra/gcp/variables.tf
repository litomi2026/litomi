variable "project_id" {
  description = "Cloud Run 프록시를 배포할 GCP 프로젝트 ID."
  type        = string
  default     = "litomi-2026"
}

variable "region" {
  description = "Cloud Run 리전. 소스 프록시는 egress IP 로테이션이 목적이므로 VPC 연결 없이 둔다."
  type        = string
  default     = "asia-northeast3"
}

variable "github_repository" {
  description = "WIF로 배포를 허용할 GitHub 저장소(owner/repo). 이 저장소의 워크플로만 배포 SA를 가장할 수 있다."
  type        = string
  default     = "litomi2026/litomi"
}

variable "deploy_service_account_id" {
  description = "CI 배포용 서비스 계정 ID(이메일 로컬 파트)."
  type        = string
  default     = "proxy-deployer"
}

variable "workload_identity_pool_id" {
  description = "GitHub Actions OIDC용 Workload Identity 풀 ID."
  type        = string
  default     = "github-actions"
}

variable "workload_identity_provider_id" {
  description = "풀 내부의 GitHub OIDC provider ID."
  type        = string
  default     = "github"
}
