#!/bin/bash

# Load deploy configuration and app runtime environment.
DEPLOY_ENV_FILE=${DEPLOY_ENV_FILE:-"infra/cloud-run/cataloger/.env.deploy"}
RUNTIME_ENV_FILE=${RUNTIME_ENV_FILE:-"apps/cataloger/.env.prod.runtime"}

set -a
if [ -f "${DEPLOY_ENV_FILE}" ]; then
  source "${DEPLOY_ENV_FILE}"
fi
if [ -f "${RUNTIME_ENV_FILE}" ]; then
  source "${RUNTIME_ENV_FILE}"
fi
set +a

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"asia-northeast1"}
JOB_NAME=${JOB_NAME:-"cataloger"}
ARTIFACT_REGISTRY_REPO=${ARTIFACT_REGISTRY_REPO:-"cloud-run-jobs"}
SERVICE_ACCOUNT_NAME=${SERVICE_ACCOUNT_NAME:-"cataloger-sa"}
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${JOB_NAME}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SCHEDULER_JOB_NAME="${JOB_NAME}-schedule"

# Schedule configuration for Cloud Scheduler (not used by the app itself)
JOB_SCHEDULE=${JOB_SCHEDULE:-"0 2 * * *"}  # Default: 2 AM daily

# Check for required environment variables
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Error: PROJECT_ID environment variable not set"
    echo ""
    echo "Please copy .env.deploy.example to .env.deploy and configure it:"
    echo "  cp infra/cloud-run/cataloger/.env.deploy.example infra/cloud-run/cataloger/.env.deploy"
    echo "  # Edit infra/cloud-run/cataloger/.env.deploy with your deploy values"
    exit 1
fi

if [ -z "${CATALOG_POSTGRES_URL:-}" ]; then
    echo "❌ Error: CATALOG_POSTGRES_URL environment variable not set"
    echo ""
    echo "Please create the runtime env file:"
    echo "  cp apps/cataloger/.env.prod.runtime.example apps/cataloger/.env.prod.runtime"
    echo "  # Edit apps/cataloger/.env.prod.runtime with production runtime values"
    exit 1
fi

echo "🚀 Starting deployment of catalog ingest job..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Job Name: ${JOB_NAME}"
echo "Artifact Registry Repo: ${ARTIFACT_REGISTRY_REPO}"
echo "Schedule: ${JOB_SCHEDULE}"
echo ""

# Check if Artifact Registry repository exists
if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPO} \
  --location=${REGION} \
  --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "⚠️  Warning: Artifact Registry repository '${ARTIFACT_REGISTRY_REPO}' not found"
  echo "Creating repository..."
  gcloud artifacts repositories create ${ARTIFACT_REGISTRY_REPO} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Cloud Run Jobs Docker images" \
    --project=${PROJECT_ID}
fi

# Clean up old images (optional, keeps last 3)
echo "Cleaning up old Artifact Registry images..."
REGISTRY_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"
ALL_IMAGES=$(gcloud artifacts docker images list ${REGISTRY_PATH}/${JOB_NAME} \
  --format="csv[no-heading](IMAGE,DIGEST,CREATE_TIME)" 2>&1 | grep -v "^Listing items" || true)

if [ -n "$ALL_IMAGES" ] && [ "$ALL_IMAGES" != "Listed 0 items." ]; then
  SORTED_IMAGES=$(echo "$ALL_IMAGES" | sort -t',' -k3,3r)
  IMAGE_COUNT=$(echo "$SORTED_IMAGES" | wc -l | tr -d ' ')
  
  if [ "$IMAGE_COUNT" -gt 3 ]; then
    echo "Found ${IMAGE_COUNT} existing images, keeping newest 3..."
    IMAGES_TO_DELETE=$(echo "$SORTED_IMAGES" | tail -n +4)
    
    while IFS=',' read -r image digest create_time; do
      if [ -n "$image" ] && [ -n "$digest" ]; then
        full_image_ref="${image}@${digest}"
        echo "Deleting old image: ${full_image_ref}"
        gcloud artifacts docker images delete "${full_image_ref}" \
          --quiet \
          --project=${PROJECT_ID} 2>/dev/null || true
      fi
    done <<< "$IMAGES_TO_DELETE"
  fi
fi

# Configure Docker authentication for Artifact Registry
echo "Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build and push the Docker image
echo "Building and pushing Docker image for linux/amd64 platform..."
if ! docker buildx build --platform linux/amd64 --push -t ${IMAGE_NAME} -f apps/cataloger/Dockerfile .; then
  echo "❌ Failed to build/push Docker image. Please check the error messages above."
  echo ""
  echo "Common fixes:"
  echo "1. Make sure Docker buildx is available:"
  echo "   docker buildx create --name litomi-builder --use"
  echo ""
  echo "2. Authenticate with Artifact Registry:"
  echo "   gcloud auth configure-docker ${REGION}-docker.pkg.dev"
  echo ""
  echo "3. Check if Docker is running:"
  echo "   docker ps"
  exit 1
fi

echo "✅ Docker image built and pushed successfully"
echo ""

# Deploy to Cloud Run Jobs
echo "Deploying to Cloud Run Jobs..."
ENV_ARGS=(
  "--set-env-vars=NODE_ENV=production"
  "--set-env-vars=CATALOG_POSTGRES_URL=${CATALOG_POSTGRES_URL}"
)
if [ -n "${CATALOG_POSTGRES_CERTIFICATE:-}" ]; then
  ENV_ARGS+=("--set-env-vars=CATALOG_POSTGRES_CERTIFICATE=${CATALOG_POSTGRES_CERTIFICATE}")
fi

if gcloud run jobs deploy ${JOB_NAME} \
  --image=${IMAGE_NAME} \
  --region=${REGION} \
  --parallelism=1 \
  --max-retries=1 \
  --task-timeout=10m \
  --memory=2Gi \
  --cpu=2 \
  --service-account="${SERVICE_ACCOUNT}" \
  "${ENV_ARGS[@]}" \
  --project=${PROJECT_ID}; then
  echo "✅ Cloud Run Job deployed successfully!"
else
  echo "❌ Failed to deploy Cloud Run Job. Please check the error messages above."
  exit 1
fi

echo ""

# Set up Cloud Scheduler
echo "Setting up Cloud Scheduler job..."

# Check if scheduler job exists and delete it if it does
if gcloud scheduler jobs describe ${SCHEDULER_JOB_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "Deleting existing scheduler job..."
  gcloud scheduler jobs delete ${SCHEDULER_JOB_NAME} \
    --location=${REGION} \
    --project=${PROJECT_ID} \
    --quiet
fi

# Create new scheduler job
if gcloud scheduler jobs create http ${SCHEDULER_JOB_NAME} \
  --location=${REGION} \
  --schedule="${JOB_SCHEDULE}" \
  --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${JOB_NAME}:run" \
  --http-method=POST \
  --oauth-service-account-email=${SERVICE_ACCOUNT} \
  --project=${PROJECT_ID}; then
  echo "✅ Cloud Scheduler job '${SCHEDULER_JOB_NAME}' set up successfully!"
  echo "   Schedule: ${JOB_SCHEDULE}"
else
  echo "⚠️  Failed to set up Cloud Scheduler job. You may need to enable the Cloud Scheduler API:"
  echo "  gcloud services enable cloudscheduler.googleapis.com --project=${PROJECT_ID}"
  echo ""
  echo "Then re-run this script or manually create the scheduler job."
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "To execute the job manually:"
echo "  gcloud run jobs execute ${JOB_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo ""
echo "To view job executions:"
echo "  gcloud run jobs executions list --job=${JOB_NAME} --region=${REGION} --project=${PROJECT_ID}"
echo ""
echo "To view logs:"
echo "  gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${JOB_NAME}\" --project=${PROJECT_ID} --limit=50"
echo ""
echo "To update the schedule:"
echo "  gcloud scheduler jobs update http ${SCHEDULER_JOB_NAME} --schedule=\"NEW_SCHEDULE\" --location=${REGION} --project=${PROJECT_ID}"
echo ""
