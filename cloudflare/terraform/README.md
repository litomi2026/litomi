# Cloudflare Terraform

This directory contains Terraform configuration for managing Cloudflare settings for the Litomi application.

## 🚀 Quick Start

### Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- Cloudflare account with API access
- Cloudflare API token with appropriate permissions
- `jq` for JSON parsing (installed automatically if missing)

### Initial Setup

1. **Install Terraform** (if not already installed):

```bash
brew install terraform
```

2. **Configure your environment**:

   Edit `.env` file with your Cloudflare API token:

```bash
CLOUDFLARE_API_TOKEN="your-api-token-here"
```

3. **Configure Terraform variables**:

Edit `terraform.tfvars` with your Cloudflare details:

- `zone_id`: Your Cloudflare Zone ID
- `account_id`: Your Cloudflare Account ID
- `domain`: Your domain name

4. **Run the setup script**:

```bash
./setup.sh
./auto-import.sh
```

5. **Review and apply changes**:

```bash
cd cloudflare/terraform
export $(grep -v '^#' .env | xargs)
terraform init
# terraform plan
terraform apply
```

## 🔑 Authentication

### Creating a Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Custom token" template
4. Configure permissions:
   - Zone → Cache Purge → Edit
   - Zone → Page Rules → Edit
   - Zone → Zone Settings → Edit
   - Zone → Managed headers → Edit
   - Zone → DNS → Edit
   - Zone → Single Redirect → Edit
5. Add zone resources:
   - Include → Specific zone → Your domain

### Finding Your Zone and Account IDs

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. On the Overview page:
   - **Zone ID**: Listed in the right sidebar
   - **Account ID**: Listed below the Zone ID

## 📊 Outputs

After applying the configuration, Terraform provides:

- `cache_ruleset_id` - The ID of the created cache ruleset
- `cache_ruleset_name` - The name of the cache ruleset
- `cache_rules_count` - Number of cache rules configured

View outputs with:

```bash
terraform output
```
