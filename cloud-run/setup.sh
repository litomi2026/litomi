#!/bin/bash

# Initial setup script for Cloud Run deployment
# Load environment variables or use defaults
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"asia-northeast1"}

# Check for required environment variables
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Error: PROJECT_ID environment variable not set"
    echo ""
    echo "Please set the required environment variables:"
    echo "  export PROJECT_ID=your-gcp-project-id"
    echo ""
    echo "Or copy env.example to .env and source it:"
    echo "  cp cloud-run/env.example cloud-run/.env"
    echo "  # Edit cloud-run/.env with your values"
    echo "  source cloud-run/.env"
    exit 1
fi

echo "=== Cloud Run Crawler Setup ==="
echo "Project ID: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# 1. Set the project
echo "Setting active project..."
gcloud config set project ${PROJECT_ID}

# 2. Enable required APIs
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# 3. Configure Docker authentication
echo "Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# 4. Set up Docker buildx for multi-platform builds
echo "Setting up Docker buildx..."
if ! docker buildx ls | grep -q "litomi-builder"; then
  docker buildx create --name litomi-builder --use
else
  docker buildx use litomi-builder
fi
docker buildx inspect --bootstrap

# 5. Check if we can use Cloud Run in the selected region
echo "Checking Cloud Run availability in ${REGION}..."
if gcloud run regions list --format="value(name)" | grep -q "${REGION}"; then
  echo "✓ Cloud Run is available in ${REGION}"
else
  echo "✗ Cloud Run might not be available in ${REGION}"
  echo "Available regions:"
  gcloud run regions list --format="table(name,display_name)"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Set your environment variables:"
echo "   cp cloud-run/.env.template cloud-run/.env"
echo "   # Edit cloud-run/.env with your values"
echo "   source cloud-run/.env"
echo ""
echo "2. Run the deployment script:"
echo "   ./cloud-run/deploy.sh"
echo ""
