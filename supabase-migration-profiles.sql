-- Migration: Add all missing columns to the profiles table
-- Run this in your Supabase SQL editor

alter table profiles
  -- Basic info
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists is_company_profile boolean default false,
  add column if not exists subscription_tier text,
  add column if not exists verification_badges text[],
  add column if not exists tags text[],

  -- Location
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,

  -- Availability / collaboration
  add column if not exists remote_friendly boolean default false,
  add column if not exists languages text[],
  add column if not exists availability text,
  add column if not exists hours_per_week numeric,
  add column if not exists collaboration_type text,

  -- Founder fields
  add column if not exists stage text,
  add column if not exists archetype text,
  add column if not exists problem_statement text,
  add column if not exists target_customer text,
  add column if not exists market_type text,
  add column if not exists help_needed text[],
  add column if not exists equity_range_min numeric,
  add column if not exists equity_range_max numeric,
  add column if not exists timeline_urgency text,

  -- Collaborator fields
  add column if not exists primary_skills text[],
  add column if not exists secondary_skills text[],
  add column if not exists startup_experience text,
  add column if not exists risk_tolerance text,
  add column if not exists motivation text,
  add column if not exists preferred_archetype text,
  add column if not exists open_to_cofounder boolean default false,

  -- Investor fields
  add column if not exists investment_thesis text,
  add column if not exists investment_stages text[],
  add column if not exists investment_industries text[],
  add column if not exists ticket_size_min numeric,
  add column if not exists ticket_size_max numeric,
  add column if not exists investment_instruments text[],
  add column if not exists geographic_focus text[],
  add column if not exists portfolio_highlights text,
  add column if not exists office_hours_available boolean default false,
  add column if not exists open_to_intros boolean default false,

  -- Service provider fields
  add column if not exists service_types text[],
  add column if not exists service_stage_focus text[],
  add column if not exists free_intro_call boolean default false,
  add column if not exists startup_discounts boolean default false,
  add column if not exists past_clients text,
  add column if not exists certifications text,

  -- Accelerator / event organizer fields
  add column if not exists program_type text,
  add column if not exists equity_taken numeric,
  add column if not exists funding_offered numeric,
  add column if not exists next_intake_date text,
  add column if not exists focus_areas text[],
  add column if not exists benefits_offered text[],
  add column if not exists founder_match_facilitation boolean default false;
