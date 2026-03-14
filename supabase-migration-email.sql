-- Add email to profiles and backfill from auth.users

-- 1. Add column (nullable first so backfill can run)
alter table profiles
  add column if not exists email text;

-- 2. Backfill existing rows from auth.users
update profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and p.email is null;

-- 3. Trigger: auto-populate email on INSERT or UPDATE when not supplied
create or replace function sync_profile_email()
returns trigger
language plpgsql
security definer
as $$
begin
  if (new.email is null or new.email = '') and new.user_id is not null then
    select email into new.email
    from auth.users
    where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_profile_email on profiles;
create trigger set_profile_email
  before insert or update on profiles
  for each row execute function sync_profile_email();
