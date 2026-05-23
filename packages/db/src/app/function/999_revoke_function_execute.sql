revoke execute on all functions in schema public from public;

alter default privileges in schema public revoke execute on functions from public;

do $$
begin
  if to_regrole('anon') is not null then
    execute 'revoke execute on all functions in schema public from anon';
    execute 'alter default privileges in schema public revoke execute on functions from anon';
  end if;

  if to_regrole('authenticated') is not null then
    execute 'revoke execute on all functions in schema public from authenticated';
    execute 'alter default privileges in schema public revoke execute on functions from authenticated';
  end if;
end;
$$;
