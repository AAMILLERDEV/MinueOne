-- Migration: Fix anonymous_profiles table to match AnalyticsService expectations
-- Run this in your Supabase SQL editor

-- Add missing columns (anon_id is the correct name, replacing anonymous_id)
alter table anonymous_profiles
  add column if not exists anon_id text unique,
  add column if not exists profile_type text,
  add column if not exists subscription_tier text default 'free',
  add column if not exists consent_analytics boolean default false,
  add column if not exists consent_research boolean default false,
  add column if not exists consent_third_party boolean default false,
  add column if not exists cohort_month text,
  add column if not exists first_seen_date date,
  -- Demographics (optional fields)
  add column if not exists age_range text,
  add column if not exists gender text,
  add column if not exists education_level text,
  add column if not exists industry text,
  add column if not exists experience_years_bucket text,
  add column if not exists collaboration_intent text;
