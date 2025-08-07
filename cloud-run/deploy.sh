#!/bin/bash

# Load environment variables or use defaults
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"asia-northeast1"}
JOB_NAME=${JOB_NAME:-"job-name"}
ARTIFACT_REGISTRY_REPO=${ARTIFACT_REGISTRY_REPO:-"artifact-registry-repo"}
SERVICE_ACCOUNT_NAME=${SERVICE_ACCOUNT_NAME:-"service-account-name"}
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${JOB_NAME}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEEP_IMAGES=${KEEP_IMAGES:-3}

# Check for required environment variables
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Error: PROJECT_ID environment variable not set"
    echo ""
    echo "Please set the required environment variables:"
    echo "  export PROJECT_ID=your-gcp-project-id"
    echo "  export POSTGRES_URL=your-postgres-url"
    echo "  export NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key"
    echo "  export VAPID_PRIVATE_KEY=your-vapid-private-key"
    echo ""
    echo "Or copy env.example to .env and source it:"
    echo "  cp cloud-run/env.example cloud-run/.env"
    echo "  # Edit cloud-run/.env with your values"
    echo "  source cloud-run/.env"
    exit 1
fi

# Clean up existing images in Artifact Registry
echo "Cleaning up existing Docker images from Artifact Registry..."
echo "Repository: ${ARTIFACT_REGISTRY_REPO}, Region: ${REGION}, Project: ${PROJECT_ID}"

# First check if the repository exists
if ! gcloud artifacts repositories describe ${ARTIFACT_REGISTRY_REPO} \
  --location=${REGION} \
  --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "⚠️  Warning: Artifact Registry repository '${ARTIFACT_REGISTRY_REPO}' not found"
  echo "Please check your ARTIFACT_REGISTRY_REPO environment variable"
  echo "To list available repositories: gcloud artifacts repositories list --location=${REGION} --project=${PROJECT_ID}"
fi

REGISTRY_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"

# Get all images with their digests, sorted by creation time (newest first)
echo "Checking for existing images..."
ALL_IMAGES=$(gcloud artifacts docker images list ${REGISTRY_PATH} \
  --format="csv[no-heading](IMAGE,DIGEST,CREATE_TIME)" \
  --sort-by="~CREATE_TIME" 2>&1 | grep -v "^Listing items" || true)

if [ -n "$ALL_IMAGES" ] && [ "$ALL_IMAGES" != "Listed 0 items." ]; then
  IMAGE_COUNT=$(echo "$ALL_IMAGES" | wc -l | tr -d ' ')
  echo "Found ${IMAGE_COUNT} existing images"
  
  if [ "$KEEP_IMAGES" -gt 0 ] && [ "$IMAGE_COUNT" -gt "$KEEP_IMAGES" ]; then
    echo "Keeping the ${KEEP_IMAGES} most recent images, deleting older ones..."
    
    # Skip the first KEEP_IMAGES lines (newest images) and delete the rest
    IMAGES_TO_DELETE=$(echo "$ALL_IMAGES" | tail -n +$((KEEP_IMAGES + 1)))
    
    while IFS=',' read -r image digest create_time; do
      if [ -n "$image" ] && [ -n "$digest" ]; then
        full_image_ref="${image}@${digest}"
        echo "Deleting: ${full_image_ref} (created: ${create_time})"
        
        if gcloud artifacts docker images delete "${full_image_ref}" \
          --quiet \
          --project=${PROJECT_ID} 2>/dev/null; then
          echo "  ✓ Deleted successfully"
        else
          echo "  ✗ Failed to delete (may already be deleted)"
        fi
      fi
    done <<< "$IMAGES_TO_DELETE"
    
    echo "✅ Artifact Registry cleanup completed (kept ${KEEP_IMAGES} recent images)"
  elif [ "$KEEP_IMAGES" -eq 0 ]; then
    echo "Deleting all images (KEEP_IMAGES=0)..."
    
    while IFS=',' read -r image digest create_time; do
      if [ -n "$image" ] && [ -n "$digest" ]; then
        full_image_ref="${image}@${digest}"
        echo "Deleting: ${full_image_ref} (created: ${create_time})"
        
        if gcloud artifacts docker images delete "${full_image_ref}" \
          --quiet \
          --project=${PROJECT_ID} 2>/dev/null; then
          echo "  ✓ Deleted successfully"
        else
          echo "  ✗ Failed to delete (may already be deleted)"
        fi
      fi
    done <<< "$ALL_IMAGES"
    
    echo "✅ Artifact Registry cleanup completed (deleted all images)"
  else
    echo "No cleanup needed (${IMAGE_COUNT} images <= ${KEEP_IMAGES} keep limit)"
  fi
else
  echo "No existing images found in Artifact Registry"
fi

# Configure Docker authentication for Artifact Registry
echo "Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push the Docker image
echo "Building and pushing Docker image for linux/amd64 platform..."
if ! docker buildx build --platform linux/amd64 --push -t ${IMAGE_NAME} -f cloud-run/Dockerfile .; then
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

# Deploy to Cloud Run Jobs
echo "Deploying to Cloud Run Jobs..."
echo "Note: Using default service account. To use a custom service account, add --service-account=${SERVICE_ACCOUNT}"
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
  --service-account="${SERVICE_ACCOUNT}"; then
  echo "Cloud Run Job deployed successfully!"
else
  echo "Failed to deploy Cloud Run Job. Please check the error messages above."
  exit 1
fi
echo ""
echo "To execute the job manually:"
echo "gcloud run jobs execute ${JOB_NAME} --region=${REGION}"
echo ""

# Set up Cloud Scheduler
SCHEDULER_JOB_NAME="${JOB_NAME}-schedule"
echo "Setting up Cloud Scheduler job..."

# Enable Cloud Scheduler API if not already enabled
echo "Checking if Cloud Scheduler API is enabled..."
if ! gcloud services list --enabled --filter="name:cloudscheduler.googleapis.com" --format="value(name)" --project=${PROJECT_ID} | grep -q cloudscheduler; then
  echo "Enabling Cloud Scheduler API..."
  gcloud services enable cloudscheduler.googleapis.com --project=${PROJECT_ID}
  echo "Waiting for API to be fully enabled..."
  sleep 10
fi

# Check if scheduler job exists
if gcloud scheduler jobs describe ${SCHEDULER_JOB_NAME} --location=${REGION} --project=${PROJECT_ID} >/dev/null 2>&1; then
  echo "Deleting existing Cloud Scheduler job to recreate with correct permissions..."
  gcloud scheduler jobs delete ${SCHEDULER_JOB_NAME} --location=${REGION} --project=${PROJECT_ID} --quiet
  echo "Recreating Cloud Scheduler job..."
  gcloud scheduler jobs create http ${SCHEDULER_JOB_NAME} \
    --location=${REGION} \
    --schedule="0 * * * *" \
    --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${JOB_NAME}:run" \
    --http-method=POST \
    --oauth-service-account-email=${SERVICE_ACCOUNT} \
    --project=${PROJECT_ID}
else
  echo "Creating new Cloud Scheduler job..."
  gcloud scheduler jobs create http ${SCHEDULER_JOB_NAME} \
    --location=${REGION} \
    --schedule="0 * * * *" \
    --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${JOB_NAME}:run" \
    --http-method=POST \
    --oauth-service-account-email=${SERVICE_ACCOUNT} \
    --project=${PROJECT_ID}
fi

if [ $? -eq 0 ]; then
  echo "✅ Cloud Scheduler job '${SCHEDULER_JOB_NAME}' set up successfully!"
  echo ""
  echo "Testing the setup by executing the job once..."
  if gcloud scheduler jobs run ${SCHEDULER_JOB_NAME} --location=${REGION}; then
    echo "✅ Test execution triggered successfully! Check the logs in a few seconds:"
    echo "   gcloud logging read 'resource.type=\"cloud_scheduler_job\" AND resource.labels.job_id=\"${SCHEDULER_JOB_NAME}\"' --limit=10 --project=${PROJECT_ID}"
  else
    echo "⚠️  Test execution failed. Please check the permissions and try again."
  fi
else
  echo "⚠️  Failed to set up Cloud Scheduler job. You may need to enable the Cloud Scheduler API:"
  echo "  gcloud services enable cloudscheduler.googleapis.com --project=${PROJECT_ID}"
  echo ""
  echo "Then re-run this script or manually create the scheduler job."
fi