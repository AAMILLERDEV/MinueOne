-- ============================================================
-- Minus1 — Companies migration
-- Run in Supabase SQL editor
-- ============================================================

-- ── companies ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  description           TEXT,
  logo_url              TEXT,
  website_url           TEXT,
  industry              TEXT,
  stage                 TEXT,
  created_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── company_members ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'employee', -- 'owner' | 'employee'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, profile_id)
);

-- ── Add company_id to teams ──────────────────────────────────
-- NULL = standalone group chat; NOT NULL = sub-team inside a company
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- ── Add company_id to company_checklist_items ────────────────
-- New checklists use company_id. team_id kept (nullable) for future
-- per-team checklists within a company.
ALTER TABLE company_checklist_items
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- ── updated_at trigger for companies ────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS helper functions (SECURITY DEFINER to avoid recursion) ──
-- These query company_members directly, bypassing RLS, so policies
-- on company_members can call them without infinite recursion.

CREATE OR REPLACE FUNCTION my_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM company_members
  WHERE profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION my_owned_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM company_members
  WHERE profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
  AND role = 'owner';
$$;

-- ── RLS: companies ───────────────────────────────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their companies"
  ON companies FOR SELECT
  USING (
    id IN (SELECT my_company_ids())
    OR created_by_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Company owners can update"
  ON companies FOR UPDATE
  USING (id IN (SELECT my_owned_company_ids()));

CREATE POLICY "Company owners can delete"
  ON companies FOR DELETE
  USING (id IN (SELECT my_owned_company_ids()));

-- ── RLS: company_members ─────────────────────────────────────
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view others in the same company"
  ON company_members FOR SELECT
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR company_id IN (SELECT my_company_ids())
  );

CREATE POLICY "Owners can add members"
  ON company_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Members can remove themselves; owners can remove others"
  ON company_members FOR DELETE
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR company_id IN (SELECT my_owned_company_ids())
  );

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_profile_id ON company_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_teams_company_id            ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_company_id  ON company_checklist_items(company_id);
