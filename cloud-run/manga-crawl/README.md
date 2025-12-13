# Manga Crawl - Cloud Run Job

A periodic Cloud Run job that automatically crawls new manga data from multiple sources and stores it in a PostgreSQL database.

## Features

- **Automatic New Manga Detection**: Automatically detects and crawls new manga IDs
- **Smart ID Range Detection**: Fetches highest ID from database and latest from K-Hentai to determine what to crawl
- **Concurrent Processing**: Processes multiple manga IDs concurrently for improved performance
- **Multi-Source Support**: Fetches data from K-Hentai, Hiyobi, Hitomi, Harpi, Komi, and HentaiPaw
- **Database Integration**: Stores manga metadata including artists, tags, characters, series, etc.
- **Scheduled Execution**: Automated execution via Cloud Scheduler
- **Production Ready**: Distroless container image for security and minimal footprint

## Architecture

```
Cloud Scheduler → Cloud Run Job → K-Hentai (Latest ID) → Multi-Source Crawl → PostgreSQL (Neon)
                                 ↓
                          Check Highest DB ID
```

## How It Works

The manga crawl job operates automatically with the following workflow:

1. **Database Check**: Queries the PostgreSQL database to find the highest manga ID that has been crawled
2. **K-Hentai Range Detection**: Makes a single API call to K-Hentai to fetch:
   - The latest (highest) manga ID from their newest content
   - The lowest manga ID from the search results (used as starting point when DB is empty)
3. **Range Calculation**: Determines the range of manga IDs to crawl:
   - If database has data: Crawl from (highest DB ID + 1) to latest K-Hentai ID
   - If database is empty: Crawl from lowest ID in K-Hentai search results to latest K-Hentai ID
4. **Multi-Source Crawling**: For each manga ID in the range:
   - Fetches manga data from multiple sources concurrently (K-Hentai, Hiyobi, Hitomi, Harpi, Komi, HentaiPaw)
   - Merges data from all available sources
   - Retries failed requests with exponential backoff
5. **Database Storage**: Saves manga metadata including titles, descriptions, artists, tags, characters, series, groups, languages, and uploaders
6. **Automatic Termination**: Job completes when all new manga IDs have been processed or when no new manga is found

## Prerequisites

- Google Cloud Platform account with billing enabled
- Docker installed locally
- `gcloud` CLI installed and configured
- PostgreSQL database (e.g., Neon)
- Node.js/Bun runtime for local development

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository and navigate to the project root
cd /path/to/litomi

# Copy the environment template
cp cloud-run/manga-crawl/env.template cloud-run/manga-crawl/.env

# Edit the .env file with your configuration
# Important: Set PROJECT_ID, NEON_DATABASE_URL, and other required values
vim cloud-run/manga-crawl/.env

# Source the environment variables
source cloud-run/manga-crawl/.env

# Make scripts executable
chmod +x cloud-run/manga-crawl/deploy.sh

# Run the deployment script
./cloud-run/manga-crawl/deploy.sh
```

### 2. Deploy the Job

```bash
# Deploy using the deployment script
./cloud-run/manga-crawl/deploy.sh

# Or use Cloud Build for CI/CD
gcloud builds submit --config=cloud-run/manga-crawl/cloudbuild.yaml --substitutions=_NEON_DATABASE_URL="postgresql://..."
```

### 3. Manual Execution

```bash
# Execute the job manually
gcloud run jobs execute manga-crawl --region=asia-northeast1

# View execution history
gcloud run jobs executions list --job=manga-crawl --region=asia-northeast1

# View logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=manga-crawl" --limit=50
```

## Configuration

### Environment Variables

| Variable            | Description                  | Default         | Required |
| ------------------- | ---------------------------- | --------------- | -------- |
| `PROJECT_ID`        | GCP Project ID               | -               | Yes      |
| `REGION`            | GCP Region                   | asia-northeast1 | Yes      |
| `NEON_DATABASE_URL` | PostgreSQL connection string | -               | Yes      |

### Schedule Configuration

The job schedule is configured during deployment (not via environment variables). The schedule uses standard cron expressions. Common examples:

- `0 */6 * * *` - Every 6 hours
- `0 2 * * *` - Daily at 2 AM
- `0 0 * * 0` - Weekly on Sunday at midnight
- `*/30 * * * *` - Every 30 minutes
- `0 9,21 * * *` - Twice daily at 9 AM and 9 PM

To update the schedule:

```bash
gcloud scheduler jobs update http manga-crawl-schedule \
  --schedule="NEW_CRON_EXPRESSION" \
  --location=asia-northeast1
```

### Resource Configuration

Default resource allocation:

- Memory: 2Gi
- CPU: 2 vCPUs
- Timeout: 30 minutes
- Max retries: 1
- Parallelism: 1

Adjust in `deploy.sh` or `cloudbuild.yaml` as needed.

## Development

### Local Testing

```bash
# Install dependencies
bun install

# Run the crawler locally
NEON_DATABASE_URL=your_connection_string \
bun run cloud-run/manga-crawl/src/index.ts
```

### Building the Docker Image Locally

```bash
# Build for local testing
docker build -f cloud-run/manga-crawl/Dockerfile -t manga-crawl:local .

# Run locally
docker run --env-file cloud-run/manga-crawl/.env manga-crawl:local
```

## Monitoring

### View Logs

```bash
# Recent logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=manga-crawl" \
  --project=YOUR_PROJECT_ID \
  --limit=50 \
  --format=json

# Stream logs
gcloud alpha logging tail "resource.type=cloud_run_job AND resource.labels.job_name=manga-crawl" \
  --project=YOUR_PROJECT_ID
```

### Metrics

Monitor job performance in the Cloud Console:

1. Go to Cloud Run → Jobs
2. Select `manga-crawl`
3. View Metrics tab for execution history, duration, and success rate

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required environment variables are set in your `.env` file
   - Verify the deployment script is reading the correct `.env` file

2. **"Failed to build/push Docker image"**
   - Run `gcloud auth configure-docker asia-northeast1-docker.pkg.dev`
   - Ensure Docker buildx is configured: `docker buildx create --use`

3. **"Cloud Scheduler job failed to create"**
   - Enable the Cloud Scheduler API: `gcloud services enable cloudscheduler.googleapis.com`
   - Ensure App Engine is created in your project

4. **Database connection errors**
   - Verify `NEON_DATABASE_URL` is correct and includes SSL mode
   - Check database allows connections from Cloud Run

5. **Job timeout**
   - Increase `--task-timeout` in deployment configuration
   - The job automatically determines the range to crawl

### Clean Up

To remove all resources:

```bash
# Delete the Cloud Run job
gcloud run jobs delete manga-crawl --region=asia-northeast1

# Delete the Cloud Scheduler job
gcloud scheduler jobs delete manga-crawl-schedule --location=asia-northeast1

# Delete Docker images from Artifact Registry
gcloud artifacts docker images delete \
  asia-northeast1-docker.pkg.dev/PROJECT_ID/cloud-run-jobs/manga-crawl

# Delete the service account (optional)
gcloud iam service-accounts delete manga-crawl-sa@PROJECT_ID.iam.gserviceaccount.com
```

## Cost Optimization

- Adjust the schedule frequency based on your needs
- Use smaller memory/CPU allocations if sufficient
- Consider using Cloud Run jobs with reserved capacity for predictable workloads
- Enable image lifecycle policies in Artifact Registry to auto-delete old images

## Security Best Practices

- Use Secret Manager for sensitive environment variables
- Regularly update dependencies and base images
- Use least-privilege service account permissions
- Enable VPC Service Controls if needed
- Audit logs regularly

## Support

For issues or questions:

1. Check the logs for error messages
2. Verify all environment variables are correctly set
3. Ensure GCP APIs are enabled and permissions are granted
4. Review the troubleshooting section above
