-- Multi-team support migration
-- Run this in your Supabase SQL editor

-- Drop old single-room team chat table
drop table if exists team_group_messages cascade;

-- ─── TEAMS ───────────────────────────────────────────────────────────────────
create table if not exists teams (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  code             text not null unique,
  owner_profile_id uuid not null references profiles(id),
  created_at       timestamptz default now()
);

alter table teams enable row level security;

-- Allow all authenticated users to read teams (needed for join-by-code lookup
-- before the user is a member yet)
create policy "teams: authenticated read"
  on teams for select to authenticated using (true);

create policy "teams: insert own"
  on teams for insert to authenticated
  with check (owner_profile_id in (select id from profiles where user_id = auth.uid()));

create policy "teams: update own"
  on teams for update to authenticated
  using (owner_profile_id in (select id from profiles where user_id = auth.uid()));

create policy "teams: delete own"
  on teams for delete to authenticated
  using (owner_profile_id in (select id from profiles where user_id = auth.uid()));

-- ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  role       text not null default 'member',
  joined_at  timestamptz default now(),
  unique(team_id, profile_id)
);

alter table team_members enable row level security;

create policy "team_members: authenticated read"
  on team_members for select to authenticated using (true);

create policy "team_members: insert own or as owner"
  on team_members for insert to authenticated
  with check (
    -- user adding themselves
    profile_id in (select id from profiles where user_id = auth.uid())
    -- OR the team owner adding someone else
    or team_id in (
      select id from teams
      where owner_profile_id in (select id from profiles where user_id = auth.uid())
    )
  );

create policy "team_members: delete own or team owner"
  on team_members for delete to authenticated
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
    or team_id in (
      select id from teams
      where owner_profile_id in (select id from profiles where user_id = auth.uid())
    )
  );

-- ─── TEAM GROUP MESSAGES ──────────────────────────────────────────────────────
create table if not exists team_group_messages (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references teams(id) on delete cascade,
  sender_profile_id uuid not null references profiles(id),
  content           text not null,
  created_at        timestamptz default now()
);

alter table team_group_messages enable row level security;

create policy "team_group_messages: read if member"
  on team_group_messages for select to authenticated
  using (
    team_id in (
      select team_id from team_members
      where profile_id in (select id from profiles where user_id = auth.uid())
    )
  );

create policy "team_group_messages: insert own"
  on team_group_messages for insert to authenticated
  with check (sender_profile_id in (select id from profiles where user_id = auth.uid()));

-- ─── REALTIME ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table team_group_messages;

-- ─── SCHEMA CACHE ─────────────────────────────────────────────────────────────
notify pgrst, 'reload schema';
