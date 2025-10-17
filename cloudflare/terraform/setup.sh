#!/bin/bash

set -e

echo ""
echo "🚀 Cloudflare Terraform Setup Script"
echo "===================================="

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo ""
    echo "❌ Terraform is not installed."
    echo "   Please install it first: brew install terraform"
    exit 1
fi

# Load .env file if it exists
if [ -f ".env" ]; then
    echo ""
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  .env file not found."
    echo "   Creating .env from template..."
    cp .env.template .env
    echo "   Please edit .env and add your CLOUDFLARE_API_TOKEN"
    echo "   Create a token at: https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo ""
    echo "📋 Creating terraform.tfvars from template..."
    cp terraform.tfvars.template terraform.tfvars
    echo "⚠️  Please edit terraform.tfvars with your Cloudflare credentials:"
    echo "   - zone_id: Your Cloudflare Zone ID"
    echo "   - account_id: Your Cloudflare Account ID"  
    echo "   - domain: Your domain name"
    echo ""
    echo "   Find these values in your Cloudflare Dashboard"
    exit 0
fi

# Check if CLOUDFLARE_API_TOKEN is set (after loading .env)
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo ""
    echo "⚠️  CLOUDFLARE_API_TOKEN is not set in .env file."
    echo "   Please edit .env and add your API token:"
    echo "   CLOUDFLARE_API_TOKEN=\"your-token-here\""
    echo "   Create a token at: https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi

# Initialize Terraform
echo ""
echo "📦 Initializing Terraform..."
terraform init

# Format the configuration
echo ""
echo "🎨 Formatting configuration files..."
terraform fmt

# Validate configuration
echo ""
echo "✅ Validating configuration..."
terraform validate

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Available commands:"
echo "   ./auto-import.sh     - Import existing Cloudflare resources"
echo "   terraform plan       - Review changes"
echo "   terraform apply      - Apply changes"
echo ""
echo "💡 If you have existing Cloudflare resources, run ./auto-import.sh first!"
echo ""
