do $$
declare
  job_name constant text := 'litomi-app-cleanup-auth-sessions';
  job_schedule constant text := '0 21 * * *';
  job_command constant text := 'select public.cleanup_auth_session_tables();';
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = job_name
    and username = current_user;

  if existing_job_id is null then
    perform cron.schedule(job_name, job_schedule, job_command);
    return;
  end if;

  perform cron.alter_job(
    existing_job_id,
    schedule := job_schedule,
    command := job_command,
    database := current_database(),
    active := true
  );
end;
$$;

do $$
declare
  job_name constant text := 'litomi-app-cleanup-inactive-users';
  job_schedule constant text := '5 21 * * *';
  job_command constant text := 'select public.cleanup_inactive_users(200);';
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = job_name
    and username = current_user;

  if existing_job_id is null then
    perform cron.schedule(job_name, job_schedule, job_command);
    return;
  end if;

  perform cron.alter_job(
    existing_job_id,
    schedule := job_schedule,
    command := job_command,
    database := current_database(),
    active := true
  );
end;
$$;
