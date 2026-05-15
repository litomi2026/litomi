terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
  required_version = ">= 1.0"
}

provider "cloudflare" {
  # API token will be read from CLOUDFLARE_API_TOKEN environment variable
}
