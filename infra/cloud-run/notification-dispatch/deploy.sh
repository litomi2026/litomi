#!/bin/bash

# Load environment variables or use defaults
set -a
if [ -f "infra/cloud-run/notification-dispatch/.env" ]; then
  source infra/cloud-run/notification-dispatch/.env
fi
set +a

PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"asia-northeast1"}
JOB_NAME=${JOB_NAME:-"notification-dispatch"}
ARTIFACT_REGISTRY_REPO=${ARTIFACT_REGISTRY_REPO:-"cloud-run-jobs"}
SERVICE_ACCOUNT_NAME=${SERVICE_ACCOUNT_NAME:-"notification-dispatch-sa"}
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${JOB_NAME}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SCHEDULER_JOB_NAME="${JOB_NAME}-schedule"
JOB_SCHEDULE=${JOB_SCHEDULE:-"0 * * * *"}  # Default: hourly

# Check for required environment variables
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Error: PROJECT_ID environment variable not set"
    echo ""
    echo "Please copy env.template to .env and configure it:"
    echo "  cp infra/cloud-run/notification-dispatch/env.template infra/cloud-run/notification-dispatch/.env"
    echo "  # Edit infra/cloud-run/notification-dispatch/.env with your values"
    exit 1
fi

if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPO} \
  --location=${REGION} \
  --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "⚠️  Warning: Artifact Registry repository '${ARTIFACT_REGISTRY_REPO}' not found"
  echo "Please check your ARTIFACT_REGISTRY_REPO environment variable"
  echo "To list available repositories: gcloud artifacts repositories list --location=${REGION} --project=${PROJECT_ID}"
fi

echo "🚀 Starting deployment of notification dispatch job..."
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Job Name: ${JOB_NAME}"
echo "Artifact Registry Repo: ${ARTIFACT_REGISTRY_REPO}"
echo "Schedule: ${JOB_SCHEDULE}"
echo ""

echo "Cleaning up Artifact Registry images..."
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
if ! docker buildx build --platform linux/amd64 --push -t ${IMAGE_NAME} -f apps/notification-dispatch/Dockerfile .; then
  echo "Failed to build/push Docker image. Please check the error messages above."
  echo ""
  echo "Common fixes:"
  echo "1. Make sure Docker buildx is available:"
  echo "   docker buildx create --name litomi-builder --use"
  echo ""
  echo "2. Authenticate with Artifact Registry:"
  echo "   gcloud auth configure-docker ${REGION}-docker.pkg.dev"
  echo ""
  echo "3. If gcloud is not found, install/activate Google Cloud SDK:"
  echo "   brew install google-cloud-sdk"
  echo "   source ~/.zshrc"
  exit 1
fi

echo "Deploying to Cloud Run Jobs..."
if gcloud run jobs deploy ${JOB_NAME} \
  --image=${IMAGE_NAME} \
  --region=${REGION} \
  --parallelism=1 \
  --max-retries=1 \
  --task-timeout=5m \
  --memory=2Gi \
  --cpu=2 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="POSTGRES_URL=${POSTGRES_URL}" \
  --set-env-vars="NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}" \
  --set-env-vars="VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}" \
  --service-account="${SERVICE_ACCOUNT}" \
  --project=${PROJECT_ID}; then
  echo "✅ Cloud Run Job ${JOB_NAME} deployed successfully!"
else
  echo "Failed to deploy Cloud Run Job. Please check the error messages above."
  exit 1
fi

echo ""
echo "Setting up Cloud Scheduler job..."

if gcloud scheduler jobs describe ${SCHEDULER_JOB_NAME} \
  --location=${REGION} \
  --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "Deleting existing scheduler job..."
  gcloud scheduler jobs delete ${SCHEDULER_JOB_NAME} \
    --location=${REGION} \
    --project=${PROJECT_ID} \
    --quiet
fi

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
fi
