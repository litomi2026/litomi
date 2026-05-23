create or replace function public.get_inactive_user_cleanup_candidates (
  batch_size integer default 100,
  run_at timestamptz default now()
) returns table (
  user_id bigint,
  effective_last_activity_at timestamptz,
  session_valid_until timestamptz,
  effective_auto_deletion_day integer
) language sql stable
set
  search_path = '' as $function$
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
      coalesce(settings.auto_deletion_day, 90)::integer as effective_auto_deletion_day
  ) as candidate on true
  where coalesce(batch_size, 0) > 0
    and candidate.effective_auto_deletion_day > 0
    and candidate.effective_last_activity_at
      + make_interval(days => candidate.effective_auto_deletion_day)
      + interval '30 days' <= run_at
    and coalesce(session_activity.session_valid_until, '-infinity'::timestamptz) <= run_at
  order by greatest(
    candidate.effective_last_activity_at,
    coalesce(session_activity.session_valid_until, '-infinity'::timestamptz)
  ) asc, u.id asc
  limit greatest(coalesce(batch_size, 0), 0);
$function$;
