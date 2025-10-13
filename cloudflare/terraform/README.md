# Cloudflare Terraform

This directory contains Terraform configuration for managing Cloudflare cache rules and rate limiting for the Litomi application.

## 🚀 Quick Start

### Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- Cloudflare account with API access
- Cloudflare API token with appropriate permissions

### Setup

1. **Install Terraform** (if not already installed):

   ```bash
   brew install terraform
   ```

2. **Run the setup script**:

   ```bash
   ./setup.sh
   ```

   The script will:

   - Check for Terraform installation
   - Create configuration files from templates
   - Initialize Terraform
   - Format and validate the configuration

3. **Configure your environment**:

   Create `.env` file with your Cloudflare API token:

   ```bash
   CLOUDFLARE_API_TOKEN="your-api-token-here"
   ```

4. **Configure Terraform variables**:

   Copy the template and create your local configuration:

   ```bash
   cp terraform.tfvars.template terraform.tfvars
   ```

   Edit `terraform.tfvars` with your Cloudflare details:

5. **Review and apply changes**:

   ```bash
   export $(grep -v '^#' .env | xargs)
   terraform plan
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
