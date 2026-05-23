create or replace function public.cleanup_auth_session_tables () returns void language plpgsql security definer
set
  search_path = '' as $function$
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

revoke
execute on function public.cleanup_auth_session_tables ()
from
  public;
