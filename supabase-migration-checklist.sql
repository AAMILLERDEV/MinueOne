-- Migration: Company checklist system
-- Run this in your Supabase project's SQL editor

create table if not exists company_checklist_items (
  id                  uuid primary key default gen_random_uuid(),
  team_id             uuid references teams(id) on delete cascade not null,
  stage               integer not null default 1,           -- 1 | 2 | 3 | 4 | 5
  category            text not null default 'General',
  title               text not null,
  status              text not null default 'not_started',  -- 'not_started' | 'in_progress' | 'complete' | 'custom'
  custom_label        text,                                 -- used when status = 'custom'
  assignee_profile_id uuid references profiles(id) on delete set null,
  due_date            date,
  notes               text,
  url                 text,
  sort_order          integer not null default 0,
  is_from_template    boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger company_checklist_items_updated_at
  before update on company_checklist_items
  for each row execute function set_updated_at();

-- Fast lookups by team + stage
create index if not exists idx_checklist_team_stage
  on company_checklist_items (team_id, stage, sort_order);

-- Fast lookups by assignee
create index if not exists idx_checklist_assignee
  on company_checklist_items (assignee_profile_id);

-- RLS: team members can read/write their team's items
alter table company_checklist_items enable row level security;

create policy "Team members can view checklist items"
  on company_checklist_items for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = company_checklist_items.team_id
        and tm.profile_id = (
          select id from profiles where user_id = auth.uid() limit 1
        )
    )
  );

create policy "Team members can insert checklist items"
  on company_checklist_items for insert
  with check (
    exists (
      select 1 from team_members tm
      where tm.team_id = company_checklist_items.team_id
        and tm.profile_id = (
          select id from profiles where user_id = auth.uid() limit 1
        )
    )
  );

create policy "Team members can update checklist items"
  on company_checklist_items for update
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = company_checklist_items.team_id
        and tm.profile_id = (
          select id from profiles where user_id = auth.uid() limit 1
        )
    )
  );

create policy "Team members can delete checklist items"
  on company_checklist_items for delete
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = company_checklist_items.team_id
        and tm.profile_id = (
          select id from profiles where user_id = auth.uid() limit 1
        )
    )
  );
