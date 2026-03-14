-- Admin system
-- Adds is_admin flag to profiles and grants admins full read/write access

-- 1. Add is_admin column
alter table profiles
  add column if not exists is_admin boolean default false;

-- 2. Helper function — security definer so it runs as the DB owner
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from profiles where user_id = auth.uid() limit 1),
    false
  );
$$;

-- 3. Admin RLS overrides
--    These must be added AFTER your existing policies.

-- Profiles: admins can read all profiles
create policy "admins read all profiles"
  on profiles for select
  using (is_admin());

-- Profiles: admins can update any profile
create policy "admins update any profile"
  on profiles for update
  using (is_admin());

-- Feed posts: admins can read ALL posts (including unapproved)
create policy "admins read all feed posts"
  on feed_posts for select
  using (is_admin());

-- Feed posts: admins can update any post (approve/reject)
create policy "admins update any feed post"
  on feed_posts for update
  using (is_admin());

-- Feed posts: admins can delete any post
create policy "admins delete any feed post"
  on feed_posts for delete
  using (is_admin());

-- Matches: admins can read all matches
create policy "admins read all matches"
  on matches for select
  using (is_admin());

-- Messages: admins can read all messages
create policy "admins read all messages"
  on messages for select
  using (is_admin());

-- 4. Designate your first admin
--    Replace the email below with your own, then run this block.
--    (Comment out after running so it's not accidentally re-run.)
--
-- update profiles
--   set is_admin = true, is_premium = true, subscription_tier = 'enterprise'
--   where user_id = (select id from auth.users where email = 'your@email.com');
