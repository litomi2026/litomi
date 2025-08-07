#!/bin/bash

# Load environment variables or use defaults
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"asia-northeast1"}
JOB_NAME=${JOB_NAME:-"job-name"}
ARTIFACT_REGISTRY_REPO=${ARTIFACT_REGISTRY_REPO:-"artifact-registry-repo"}
SERVICE_ACCOUNT_NAME=${SERVICE_ACCOUNT_NAME:-"service-account-name"}
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}/${JOB_NAME}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

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

# Enable required APIs
echo "Ensuring required APIs are enabled..."

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

# Configure Docker authentication for Artifact Registry
echo "Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Note: Cleanup policies can be set manually via console or using gcloud beta
echo "Note: To set up automatic cleanup (keep latest 3 versions), configure it in the GCP Console"
echo "      or ensure you have gcloud beta components installed."

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
  echo "The job will run hourly at minute 0 (e.g., 1:00, 2:00, 3:00...)"
  echo ""
  echo "To check the scheduled job status:"
  echo "  gcloud scheduler jobs describe ${SCHEDULER_JOB_NAME} --location=${REGION}"
  echo ""
  echo "To run the scheduler job immediately (for testing):"
  echo "  gcloud scheduler jobs run ${SCHEDULER_JOB_NAME} --location=${REGION}"
  echo ""
  echo "To pause the scheduled job:"
  echo "  gcloud scheduler jobs pause ${SCHEDULER_JOB_NAME} --location=${REGION}"
  echo ""
  echo "To resume the scheduled job:"
  echo "  gcloud scheduler jobs resume ${SCHEDULER_JOB_NAME} --location=${REGION}"
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