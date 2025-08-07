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

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found in PATH"
    echo ""
    echo "Please install or activate Google Cloud SDK:"
    echo "  Option 1: brew install google-cloud-sdk"
    echo "  Option 2: source ~/.zshrc (if already installed)"
    echo "  Option 3: Download from https://cloud.google.com/sdk/install"
    exit 1
fi

echo "=== Cloud Run Crawler Setup ==="
echo "Project ID: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# Enable required APIs
echo "Ensuring required APIs are enabled..."


# Set the project
echo "Setting active project..."
gcloud config set project ${PROJECT_ID}


# Enable Cloud Run API
if ! gcloud services list --enabled --filter="name:run.googleapis.com" --format="value(name)" --project=${PROJECT_ID} | grep -q run; then
  echo "Enabling Cloud Run API..."
  gcloud services enable run.googleapis.com --project=${PROJECT_ID}
  sleep 5
fi

# Enable Artifact Registry API
if ! gcloud services list --enabled --filter="name:artifactregistry.googleapis.com" --format="value(name)" --project=${PROJECT_ID} | grep -q artifactregistry; then
  echo "Enabling Artifact Registry API..."
  gcloud services enable artifactregistry.googleapis.com --project=${PROJECT_ID}
  sleep 5
fi

# Enable Cloud Scheduler API
if ! gcloud services list --enabled --filter="name:cloudscheduler.googleapis.com" --format="value(name)" --project=${PROJECT_ID} | grep -q cloudscheduler; then
  echo "Enabling Cloud Scheduler API..."
  gcloud services enable cloudscheduler.googleapis.com --project=${PROJECT_ID}
  sleep 5
fi

# Check if service account exists, create if not
echo "Checking service account..."
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT} --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "Creating service account..."
  gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="Litomi Crawler Service Account" \
    --project=${PROJECT_ID}
else
  echo "Service account already exists: ${SERVICE_ACCOUNT}"
fi

# Grant necessary permissions (whether newly created or existing)
echo "Ensuring service account has necessary permissions..."

# Grant Cloud Run Invoker role (to invoke services)
echo "Granting Cloud Run Invoker role..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.invoker" \
  --condition=None

# Grant Cloud Run Developer role (to execute jobs)
echo "Granting Cloud Run Developer role..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.developer" \
  --condition=None

# Grant permission to act as the service account
echo "Granting Service Account User role..."
gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --project=${PROJECT_ID}

# Create Artifact Registry repository if it doesn't exist
echo "Checking Artifact Registry repository..."
if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPO} --location=${REGION} --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "Creating Artifact Registry repository..."
  gcloud artifacts repositories create ${ARTIFACT_REGISTRY_REPO} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Cloud Run Jobs Docker images" \
    --project=${PROJECT_ID}
fi

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
