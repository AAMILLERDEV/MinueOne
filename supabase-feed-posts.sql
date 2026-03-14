-- Feed Posts table
-- Premium service providers can post 1 helpful insight per week for founders

create table if not exists feed_posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  author_profile_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text not null check (category in (
    'growth','fundraising','legal','tech','hiring','marketing','operations','finance','product'
  )),
  -- AI moderation result
  approved boolean default true,
  rejection_reason text,
  -- Track the posting week to enforce 1-per-week limit
  post_week integer not null,   -- ISO week number
  post_year integer not null
);

-- RLS
alter table feed_posts enable row level security;

-- Authenticated users can read approved posts
create policy "read approved posts"
  on feed_posts for select
  using (auth.role() = 'authenticated' and approved = true);

-- Premium service providers can insert
create policy "service providers can post"
  on feed_posts for insert
  with check (
    auth.uid() in (
      select user_id from profiles
      where profile_type = 'service_provider'
        and (
          is_premium = true
          or subscription_tier in ('pro', 'business', 'enterprise')
        )
    )
  );

-- Authors can delete their own posts
create policy "authors can delete own posts"
  on feed_posts for delete
  using (
    auth.uid() in (
      select user_id from profiles where id = author_profile_id
    )
  );

-- Index for fast category + time queries
create index if not exists feed_posts_category_created
  on feed_posts (category, created_at desc);

-- Index for weekly limit check
create index if not exists feed_posts_author_week
  on feed_posts (author_profile_id, post_year, post_week);
