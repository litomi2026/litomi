create or replace function public.cleanup_inactive_users(batch_size integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  run_at timestamptz := now();
  deleted_count integer := 0;
begin
  if batch_size is null or batch_size < 1 then
    return 0;
  end if;

  if not pg_try_advisory_xact_lock(2026041412) then
    return 0;
  end if;

  with candidates as (
    select candidate.user_id
    from public.get_inactive_user_cleanup_candidates(batch_size, run_at, true) as candidate
  ),
  deleted_users as (
    delete from public."user" as u
    using candidates
    where u.id = candidates.user_id
    returning u.id
  )
  select count(*)::integer into deleted_count
  from deleted_users;

  return deleted_count;
end;
$function$;
