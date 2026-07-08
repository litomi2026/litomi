terraform {
  required_version = ">= 1.9"

  # HCP Terraform (Terraform Cloud) 백엔드.
  # organization / workspace 는 TF_CLOUD_ORGANIZATION, TF_WORKSPACE 환경변수로 주입한다
  # (블록을 비워두면 두 값을 환경변수에서 읽는다).
  cloud {}

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
