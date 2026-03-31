-- Migration: Matching system overhaul
-- Run this in your Supabase project's SQL editor

-- Add stacking time-gate columns to swipe_actions
alter table swipe_actions
  add column if not exists decline_count integer default 0,
  add column if not exists gated_until timestamptz;

-- Retroactively apply a 7-day gate to all existing 'pass' swipes
-- (calculated from their original created_date)
update swipe_actions
set
  decline_count = 1,
  gated_until = created_date + interval '7 days'
where action = 'pass'
  and decline_count = 0
  and gated_until is null;

-- Add nda_sent and nda_signed to matches if not present
alter table matches
  add column if not exists nda_sent boolean default false,
  add column if not exists nda_signed boolean default false;

-- Index for fast pending-request lookups
create index if not exists idx_matches_to_profile_status
  on matches (to_profile_id, status);

create index if not exists idx_swipe_actions_from_to
  on swipe_actions (from_profile_id, to_profile_id);

create index if not exists idx_swipe_actions_gated
  on swipe_actions (from_profile_id, action, gated_until);
