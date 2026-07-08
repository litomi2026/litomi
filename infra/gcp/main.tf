# 이 레포의 Terraform 경계: WIF/IAM/SA 부트스트랩만 관리한다.
# Cloud Run 서비스 자체와 이미지 배포는 CI(gcloud run services replace)가 담당한다.

locals {
  required_services = [
    "run.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ]
}

resource "google_project_service" "required" {
  for_each = toset(local.required_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# --- CI 배포용 서비스 계정 ---
resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = var.deploy_service_account_id
  display_name = "litomi proxy Cloud Run deployer (CI)"

  depends_on = [google_project_service.required]
}

# Cloud Run 서비스 생성/치환 + 서비스 IAM(allUsers invoker) 설정 권한.
resource "google_project_iam_member" "deployer_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# 배포 시 런타임 서비스 계정(기본 compute SA)을 actAs 하기 위한 권한.
resource "google_project_iam_member" "deployer_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# --- GitHub Actions OIDC용 Workload Identity Federation ---
resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = var.workload_identity_pool_id
  display_name              = "GitHub Actions"
  description               = "OIDC federation for GitHub Actions workflows"

  depends_on = [google_project_service.required]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = var.workload_identity_provider_id
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.ref"              = "assertion.ref"
  }

  # 이 저장소에서 발급된 토큰만 허용(다른 저장소가 배포 SA를 가장하지 못하도록).
  attribute_condition = "assertion.repository == \"${var.github_repository}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# 지정한 GitHub 저장소의 워크플로가 배포 SA를 가장(impersonate)할 수 있게 한다.
resource "google_service_account_iam_member" "github_impersonation" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}
