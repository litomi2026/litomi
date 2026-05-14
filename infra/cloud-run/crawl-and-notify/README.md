# Cloud Run Crawler Job Setup

This directory contains the necessary files to deploy the manga crawler and notification service as a Cloud Run Job.

## Prerequisites

```zsh
cp cloud-run/crawl-and-notify/.env.template cloud-run/.env
```

Edit the `.env` file with your actual values.

```zsh
cd cloud-run/crawl-and-notify
export $(grep -v '^#' .env | xargs)
./setup.sh
```

Only execute once.

## Deployment

```zsh
./cloud-run/crawl-and-notify/deploy.sh
```

## Scheduling

The deployment script includes commands to set up Cloud Scheduler. By default, it's configured to run every hour (`0 * * * *`).

To modify the schedule, update the cron expression in the Cloud Scheduler command.

Common schedules:

- Every hour: `0 * * * *`
- Every 4 hours: `0 */4 * * *`
- Every day at midnight: `0 0 * * *`
- Every day at 6 AM and 6 PM: `0 6,18 * * *`

## Monitoring

To check the Cloud Run job status:

```zsh
gcloud run jobs executions list --job=${JOB_NAME} --location=${REGION}
```

To check the scheduled job status:

```zsh
gcloud scheduler jobs describe ${JOB_NAME}-schedule --location=${REGION}
```

## Manual Execution

To run the scheduler job immediately (for testing):

```zsh
gcloud scheduler jobs run ${JOB_NAME}-schedule --location=${REGION}"
```

To pause the scheduled job:

```zsh
gcloud scheduler jobs pause ${JOB_NAME}-schedule --location=${REGION}"
```

To resume the scheduled job:

```zsh
gcloud scheduler jobs resume ${JOB_NAME}-schedule --location=${REGION}
```
