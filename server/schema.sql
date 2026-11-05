-- =================================================================
-- PRD Section 8 & 16: Complete Database Schema for Clarity Platform
-- Run this script in the Supabase SQL Editor
-- =================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clients Table (PRD Section 8)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- References auth.users or internal user
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Projects Table (PRD Section 8 & Section 7)
-- Status enum: draft, sent, in_progress, submitted, needs_clarification, approved
-- Type enum: graphic, uiux, both
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('graphic', 'uiux', 'both')),
  objective TEXT NOT NULL,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline DATE,
  language TEXT NOT NULL DEFAULT 'id' CHECK (language IN ('id', 'en')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'submitted', 'needs_clarification', 'approved')),
  share_token TEXT UNIQUE NOT NULL,
  link_enabled BOOLEAN NOT NULL DEFAULT true,
  link_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create index on share_token for rapid token lookups from clients
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON public.projects(share_token);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);

-- 4. Briefs Table (PRD Section 8)
CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  current_step TEXT DEFAULT 'welcome',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  audience JSONB NOT NULL DEFAULT '{"target": "", "age_range": "25-34", "desired_reaction": []}'::jsonb,
  visual_direction JSONB NOT NULL DEFAULT '{"styles": [], "styles_undecided": false, "avoid_styles": [], "moods": [], "likes": [], "avoid": [], "colors": {"mode": "suggest", "palette": []}}'::jsonb,
  content JSONB NOT NULL DEFAULT '{"copy_status": "will_provide"}'::jsonb,
  assets_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  designer_interpretation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Assets Table (PRD Section 12)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assets_brief_id ON public.assets(brief_id);

-- 6. References Table (PRD Section 9 Step 7)
CREATE TABLE IF NOT EXISTS public.references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'url' CHECK (kind IN ('image', 'url')),
  url TEXT NOT NULL,
  note TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_references_brief_id ON public.references(brief_id);

-- 7. Reviews Table (PRD Section 8 & Section 13)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  decision TEXT NOT NULL CHECK (decision IN ('needs_clarification', 'approved')),
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Review Questions Table (Clarification Questions per section)
CREATE TABLE IF NOT EXISTS public.review_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  client_question TEXT NOT NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Events Table (Analytics, PRD Section 19)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Automatic Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_briefs_updated_at ON public.briefs;
CREATE TRIGGER trg_briefs_updated_at BEFORE UPDATE ON public.briefs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =================================================================
-- Storage Bucket Setup:
-- In Supabase Dashboard -> Storage -> Create New Bucket:
--   Name: 'project-assets'
--   Public: true (or configure signed URL download)
-- =================================================================

