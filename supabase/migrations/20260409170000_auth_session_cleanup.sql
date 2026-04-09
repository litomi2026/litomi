do $$
begin
  create extension if not exists pg_cron;
exception
  when undefined_file or feature_not_supported then
    raise notice 'pg_cron extension is not available; skipping schedule creation.';
end
$$;

create or replace function public.cleanup_auth_session_tables()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.auth_session_token as token
  using public.auth_session_family as family
  where token.family_id = family.id
    and (
      family.revoked_at is not null
      or family.absolute_expires_at <= now()
      or family.idle_expires_at <= now()
    );

  delete from public.auth_session_family as family
  where family.revoked_at is not null
    or family.absolute_expires_at <= now()
    or family.idle_expires_at <= now();
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'cleanup-auth-sessions',
      '17 * * * *',
      $job$select public.cleanup_auth_session_tables();$job$
    );
  else
    raise notice 'pg_cron extension is not available; cleanup-auth-sessions was not scheduled.';
  end if;
end
$$;
