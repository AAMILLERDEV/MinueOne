-- Team group messages table
create table if not exists team_group_messages (
  id uuid primary key default gen_random_uuid(),
  room_profile_id uuid not null references profiles(id),
  sender_profile_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

alter table team_group_messages enable row level security;

-- Any authenticated user can read (team chats are internal)
create policy "team_group_messages: authenticated read"
  on team_group_messages for select to authenticated using (true);

-- Can only send as yourself
create policy "team_group_messages: insert own"
  on team_group_messages for insert to authenticated
  with check (
    sender_profile_id in (select id from profiles where user_id = auth.uid())
  );

-- Enable realtime
alter publication supabase_realtime add table team_group_messages;

-- Reload schema cache
notify pgrst, 'reload schema';
