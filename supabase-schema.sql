-- Minus1 Supabase Schema
-- Run this in your Supabase project's SQL editor

-- Profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  profile_type text,
  bio text,
  avatar_url text,
  is_complete boolean default false,
  looking_for text[],
  skills text[],
  industry text,
  location text,
  linkedin_url text,
  website_url text,
  is_premium boolean default false,
  last_active timestamptz default now(),
  created_date timestamptz default now()
);

-- Swipe Actions
create table if not exists swipe_actions (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid references profiles(id) on delete cascade,
  to_profile_id uuid references profiles(id) on delete cascade,
  action text, -- 'like' | 'pass' | 'super_like'
  created_date timestamptz default now()
);

-- Matches
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid references profiles(id) on delete cascade,
  to_profile_id uuid references profiles(id) on delete cascade,
  status text default 'pending', -- 'pending' | 'matched' | 'declined'
  compatibility_score numeric,
  created_date timestamptz default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_profile_id uuid references profiles(id) on delete cascade,
  content text,
  created_date timestamptz default now()
);

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  organizer_profile_id uuid references profiles(id) on delete cascade,
  name text,
  description text,
  date timestamptz,
  location text,
  created_date timestamptz default now()
);

-- Event Attendees
create table if not exists event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  is_matched boolean default false,
  created_date timestamptz default now()
);

-- Meetings
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  organizer_profile_id uuid references profiles(id) on delete cascade,
  attendee_profile_id uuid references profiles(id) on delete cascade,
  scheduled_at timestamptz,
  status text default 'pending',
  notes text,
  created_date timestamptz default now()
);

-- Match Insights
create table if not exists match_insights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  insight_type text,
  content jsonb,
  created_date timestamptz default now()
);

-- Team Notes
create table if not exists team_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  about_profile_id uuid references profiles(id) on delete cascade,
  content text,
  is_shared boolean default false,
  created_date timestamptz default now()
);

-- Team Links
create table if not exists team_links (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid references profiles(id) on delete cascade,
  to_profile_id uuid references profiles(id) on delete cascade,
  relationship_type text, -- 'co-founder' | 'advisor' | 'team member' | 'investor' | 'mentor'
  status text default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_date timestamptz default now()
);

-- Anonymous Profiles (analytics)
create table if not exists anonymous_profiles (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text unique,
  consent jsonb,
  session_data jsonb,
  created_date timestamptz default now()
);

-- Storage bucket for file uploads
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "Authenticated uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads');

create policy "Public read uploads" on storage.objects
  for select to public
  using (bucket_id = 'uploads');
