import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'

export type DeclaredSupabaseFunction = {
  readonly name: string
  readonly definition: SQL
}

// Keep this list ordered by dependency.
export const declaredSupabaseFunctions = [
  {
    name: 'public.cleanup_auth_session_tables',
    definition: sql`
create or replace function public.cleanup_auth_session_tables()
returns void
language plpgsql
security definer
set search_path = public
as $function$
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
$function$;
`,
  },
  {
    name: 'public.get_inactive_user_cleanup_candidates',
    definition: sql`
create or replace function public.get_inactive_user_cleanup_candidates(
  batch_size integer default 100,
  run_at timestamptz default now(),
  lock_rows boolean default false
)
returns table (
  user_id bigint,
  effective_last_activity_at timestamptz,
  session_valid_until timestamptz,
  effective_auto_deletion_day integer
)
language plpgsql
set search_path = public
as $function$
begin
  if batch_size is null or batch_size < 1 then
    return;
  end if;

  if lock_rows then
    return query
    select
      u.id,
      candidate.effective_last_activity_at,
      session_activity.session_valid_until,
      candidate.effective_auto_deletion_day
    from public."user" as u
    left join public.user_settings as settings on settings.user_id = u.id
    left join lateral (
      select
        max(family.last_used_at) as last_session_used_at,
        max(
          case
            when family.revoked_at is null
              and least(family.idle_expires_at, family.absolute_expires_at) > run_at
              then least(family.idle_expires_at, family.absolute_expires_at)
            else null
          end
        ) as session_valid_until
      from public.auth_session_family as family
      where family.user_id = u.id
    ) as session_activity on true
    left join lateral (
      select
        greatest(
          coalesce(u.login_at, u.created_at),
          coalesce(session_activity.last_session_used_at, '-infinity'::timestamptz)
        ) as effective_last_activity_at,
        coalesce(settings.auto_deletion_day, u.auto_deletion_days)::integer as effective_auto_deletion_day
    ) as candidate on true
    where candidate.effective_auto_deletion_day > 0
      and candidate.effective_last_activity_at <=
        run_at - make_interval(days => candidate.effective_auto_deletion_day)
      and coalesce(session_activity.session_valid_until, '-infinity'::timestamptz) <= run_at
    order by greatest(
      candidate.effective_last_activity_at,
      coalesce(session_activity.session_valid_until, '-infinity'::timestamptz)
    ) asc, u.id asc
    limit batch_size
    for update of u skip locked;

    return;
  end if;

  return query
  select
    u.id,
    candidate.effective_last_activity_at,
    session_activity.session_valid_until,
    candidate.effective_auto_deletion_day
  from public."user" as u
  left join public.user_settings as settings on settings.user_id = u.id
  left join lateral (
    select
      max(family.last_used_at) as last_session_used_at,
      max(
        case
          when family.revoked_at is null
            and least(family.idle_expires_at, family.absolute_expires_at) > run_at
            then least(family.idle_expires_at, family.absolute_expires_at)
          else null
        end
      ) as session_valid_until
    from public.auth_session_family as family
    where family.user_id = u.id
  ) as session_activity on true
  left join lateral (
    select
      greatest(
        coalesce(u.login_at, u.created_at),
        coalesce(session_activity.last_session_used_at, '-infinity'::timestamptz)
      ) as effective_last_activity_at,
      coalesce(settings.auto_deletion_day, u.auto_deletion_days)::integer as effective_auto_deletion_day
  ) as candidate on true
  where candidate.effective_auto_deletion_day > 0
    and candidate.effective_last_activity_at <=
      run_at - make_interval(days => candidate.effective_auto_deletion_day)
    and coalesce(session_activity.session_valid_until, '-infinity'::timestamptz) <= run_at
  order by greatest(
    candidate.effective_last_activity_at,
    coalesce(session_activity.session_valid_until, '-infinity'::timestamptz)
  ) asc, u.id asc
  limit batch_size;
end;
$function$;
`,
  },
  {
    name: 'public.cleanup_inactive_users',
    definition: sql`
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
`,
  },
] satisfies ReadonlyArray<DeclaredSupabaseFunction>
