-- Minus1: Row Level Security Policies
-- Run this in your Supabase SQL editor

-- ─── PROFILES ────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "profiles: authenticated read all"
  on profiles for select to authenticated using (true);

create policy "profiles: insert own"
  on profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy "profiles: update own"
  on profiles for update to authenticated
  using (user_id = auth.uid());

create policy "profiles: delete own"
  on profiles for delete to authenticated
  using (user_id = auth.uid());

-- ─── SWIPE ACTIONS ────────────────────────────────────────────────────────────
alter table swipe_actions enable row level security;

create policy "swipe_actions: authenticated read own"
  on swipe_actions for select to authenticated
  using (
    from_profile_id in (select id from profiles where user_id = auth.uid())
    or
    to_profile_id   in (select id from profiles where user_id = auth.uid())
  );

create policy "swipe_actions: insert own"
  on swipe_actions for insert to authenticated
  with check (
    from_profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "swipe_actions: delete own"
  on swipe_actions for delete to authenticated
  using (
    from_profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── MATCHES ─────────────────────────────────────────────────────────────────
alter table matches enable row level security;

create policy "matches: read own"
  on matches for select to authenticated
  using (
    from_profile_id in (select id from profiles where user_id = auth.uid())
    or
    to_profile_id   in (select id from profiles where user_id = auth.uid())
  );

create policy "matches: insert"
  on matches for insert to authenticated with check (true);

create policy "matches: update own"
  on matches for update to authenticated
  using (
    from_profile_id in (select id from profiles where user_id = auth.uid())
    or
    to_profile_id   in (select id from profiles where user_id = auth.uid())
  );

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
alter table messages enable row level security;

create policy "messages: read in own matches"
  on messages for select to authenticated
  using (
    match_id in (
      select id from matches
      where from_profile_id in (select id from profiles where user_id = auth.uid())
         or to_profile_id   in (select id from profiles where user_id = auth.uid())
    )
  );

create policy "messages: insert own"
  on messages for insert to authenticated
  with check (
    sender_profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── EVENTS ──────────────────────────────────────────────────────────────────
alter table events enable row level security;

create policy "events: read all"
  on events for select to authenticated using (true);

create policy "events: insert own"
  on events for insert to authenticated
  with check (
    organizer_profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "events: update own"
  on events for update to authenticated
  using (
    organizer_profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── EVENT ATTENDEES ─────────────────────────────────────────────────────────
alter table event_attendees enable row level security;

create policy "event_attendees: read all"
  on event_attendees for select to authenticated using (true);

create policy "event_attendees: insert"
  on event_attendees for insert to authenticated with check (true);

create policy "event_attendees: delete own"
  on event_attendees for delete to authenticated
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── MEETINGS ────────────────────────────────────────────────────────────────
alter table meetings enable row level security;

create policy "meetings: read own"
  on meetings for select to authenticated
  using (
    organizer_profile_id in (select id from profiles where user_id = auth.uid())
    or
    attendee_profile_id  in (select id from profiles where user_id = auth.uid())
  );

create policy "meetings: insert"
  on meetings for insert to authenticated with check (true);

create policy "meetings: update own"
  on meetings for update to authenticated
  using (
    organizer_profile_id in (select id from profiles where user_id = auth.uid())
    or
    attendee_profile_id  in (select id from profiles where user_id = auth.uid())
  );

-- ─── MATCH INSIGHTS ──────────────────────────────────────────────────────────
alter table match_insights enable row level security;

create policy "match_insights: read own"
  on match_insights for select to authenticated
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "match_insights: insert"
  on match_insights for insert to authenticated with check (true);

-- ─── TEAM NOTES ──────────────────────────────────────────────────────────────
alter table team_notes enable row level security;

create policy "team_notes: read own or shared"
  on team_notes for select to authenticated
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
    or is_shared = true
  );

create policy "team_notes: insert own"
  on team_notes for insert to authenticated
  with check (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "team_notes: delete own"
  on team_notes for delete to authenticated
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ─── TEAM LINKS ──────────────────────────────────────────────────────────────
alter table team_links enable row level security;

create policy "team_links: read own"
  on team_links for select to authenticated
  using (
    from_profile_id in (select id from profiles where user_id = auth.uid())
    or
    to_profile_id   in (select id from profiles where user_id = auth.uid())
  );

create policy "team_links: insert"
  on team_links for insert to authenticated with check (true);

create policy "team_links: update involved"
  on team_links for update to authenticated
  using (
    from_profile_id in (select id from profiles where user_id = auth.uid())
    or
    to_profile_id   in (select id from profiles where user_id = auth.uid())
  );

-- ─── ANONYMOUS PROFILES ──────────────────────────────────────────────────────
alter table anonymous_profiles enable row level security;

create policy "anonymous_profiles: insert"
  on anonymous_profiles for insert to authenticated with check (true);

create policy "anonymous_profiles: read own"
  on anonymous_profiles for select to authenticated using (true);

create policy "anonymous_profiles: update"
  on anonymous_profiles for update to authenticated using (true);
