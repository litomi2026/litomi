create or replace function public.cleanup_inactive_users (batch_size integer default 100) returns integer language sql security definer
set
  search_path = '' as $function$
  with lock_attempt as (
    select pg_try_advisory_xact_lock(2026041412) as locked
  ),
  candidates as (
    select candidate.user_id
    from lock_attempt
    cross join lateral public.get_inactive_user_cleanup_candidates(batch_size) as candidate
    where lock_attempt.locked
  ),
  deleted_users as (
    delete from public."user" as u
    using candidates
    where u.id = candidates.user_id
    returning u.id
  )
  select count(*)::integer
  from deleted_users;
$function$;

revoke
execute on function public.cleanup_inactive_users (integer)
from
  public;
