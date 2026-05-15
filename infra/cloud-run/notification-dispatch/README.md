# Notification Dispatch - Cloud Run Job

Cloud Run deployment configuration for the notification dispatch job. The app code and Dockerfile live in `apps/notification-dispatch`; this directory owns Cloud Run, Cloud Build, Scheduler, and environment wiring.

## Prerequisites

```zsh
cp infra/cloud-run/notification-dispatch/env.template infra/cloud-run/notification-dispatch/.env
```

Edit `.env` with your project, registry, service account, database, and VAPID values.

```zsh
source infra/cloud-run/notification-dispatch/.env
./infra/cloud-run/notification-dispatch/setup.sh
```

Run setup once per project/region.

## Deployment

```zsh
./infra/cloud-run/notification-dispatch/deploy.sh
```

For Cloud Build:

```zsh
gcloud builds submit \
  --config=infra/cloud-run/notification-dispatch/cloudbuild.yaml \
  --substitutions=_POSTGRES_URL="postgresql://...",_NEXT_PUBLIC_VAPID_PUBLIC_KEY="...",_VAPID_PRIVATE_KEY="..."
```

## Scheduling

The deployment creates a Cloud Scheduler job named `${JOB_NAME}-schedule`. The default schedule is hourly:

```zsh
JOB_SCHEDULE="0 * * * *"
```

Common schedules:

- Every hour: `0 * * * *`
- Every 4 hours: `0 */4 * * *`
- Every day at midnight: `0 0 * * *`
- Every day at 6 AM and 6 PM: `0 6,18 * * *`

## Local Development

```zsh
bun --filter=@litomi/notification-dispatch start
```

```zsh
bun --filter=@litomi/notification-dispatch docker:build
bun --filter=@litomi/notification-dispatch docker:run
```

## Monitoring

```zsh
gcloud run jobs executions list --job=${JOB_NAME} --location=${REGION}
gcloud scheduler jobs describe ${JOB_NAME}-schedule --location=${REGION}
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=${JOB_NAME}" --limit=50
```

## Manual Operations

```zsh
gcloud run jobs execute ${JOB_NAME} --region=${REGION}
gcloud scheduler jobs run ${JOB_NAME}-schedule --location=${REGION}
gcloud scheduler jobs pause ${JOB_NAME}-schedule --location=${REGION}
gcloud scheduler jobs resume ${JOB_NAME}-schedule --location=${REGION}
```
