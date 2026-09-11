-- =========================================================================
-- PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
-- STEP 1: Database Schema & Tables with Row Level Security (RLS)
-- ROLE: Senior Backend Architect
-- TARGET RUNTIME: Supabase (PostgreSQL 15+)
-- =========================================================================

-- Enable UUID extension for auto-generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABLE: profiles
-- Stores user account info linked directly to Supabase Auth (auth.users).
-- Roles: 'citizen', 'rescue', 'authority'
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'rescue', 'authority')),
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
    location_json JSONB DEFAULT '{"lat": 13.0827, "lng": 80.2707, "address": "Chennai Central"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for role lookups and security checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Comment for Q&A:
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with emergency roles and geo-coordinates.';

-- -------------------------------------------------------------------------
-- 2. TABLE: incidents
-- Stores emergency calls/reports reported by citizens or field dispatchers.
-- Severity score: 0 (unassessed) to 10 (extreme critical danger).
-- Status: 'open' (active mission) or 'resolved' (mission complete).
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL, -- e.g., 'flood', 'fire', 'medical', 'structural_collapse'
    description TEXT NOT NULL,
    severity_score INT NOT NULL DEFAULT 0 CHECK (severity_score >= 0 AND severity_score <= 10),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    is_duplicate BOOLEAN NOT NULL DEFAULT false,
    duplicate_of_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    needed_resources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    ai_analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Raw AI inference payload & reasoning
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance Indexes for Real-time War Room queries
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON public.incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

-- Comment for Q&A:
COMMENT ON TABLE public.incidents IS 'Real-time disaster incident feed triaged by Groq AI and optimized by Gemini.';

-- -------------------------------------------------------------------------
-- 2b. TABLE / VIEW: zones
-- Real-time emergency zones mapped to geographical sectors for command console.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    severity TEXT NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('CRITICAL', 'HIGH', 'MODERATE', 'LOW')),
    severity_score INT NOT NULL DEFAULT 5 CHECK (severity_score >= 0 AND severity_score <= 10),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    needed_resources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE VIEW public.zones_view AS
SELECT 
    id,
    type AS name,
    location_lat AS latitude,
    location_lng AS longitude,
    CASE 
        WHEN severity_score >= 8 THEN 'CRITICAL'
        WHEN severity_score >= 6 THEN 'HIGH'
        WHEN severity_score >= 4 THEN 'MODERATE'
        ELSE 'LOW'
    END AS severity,
    severity_score,
    type,
    description,
    status,
    needed_resources,
    created_at
FROM public.incidents;

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "zones_select_all" ON public.zones;
CREATE POLICY "zones_select_all" ON public.zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "zones_insert_all" ON public.zones;
CREATE POLICY "zones_insert_all" ON public.zones FOR INSERT WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 3. TABLE: resources
-- Supply inventory (water, food, medical, tent) stored in relief hubs.
-- assigned_to_incident_id links a deployed asset to an active emergency.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('water', 'food', 'medical', 'tent')),
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    location_hub TEXT NOT NULL, -- e.g., 'Marina Central Depot', 'North Logistics Center'
    assigned_to_incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Foreign key & query indexes
CREATE INDEX IF NOT EXISTS idx_resources_incident ON public.resources(assigned_to_incident_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);

-- Comment for Q&A:
COMMENT ON TABLE public.resources IS 'Disaster relief supplies tied to logistics hubs or allocated to incidents.';

-- -------------------------------------------------------------------------
-- 4. TABLE: audit_logs
-- Immutable tamper-evident record of all AI decisions and Commander actions.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name TEXT NOT NULL, -- e.g., 'groq-needs-assessor', 'gemini-allocator', 'commander-authority'
    action TEXT NOT NULL,     -- e.g., 'INCIDENT_TRIAGED', 'RESOURCE_ALLOCATED', 'DYNAMIC_REALLOCATION'
    details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent ON public.audit_logs(agent_name);

-- Comment for Q&A:
COMMENT ON TABLE public.audit_logs IS 'Immutable compliance audit trail tracking autonomous agent decisions.';

-- -------------------------------------------------------------------------
-- 5. HELPER FUNCTION: get_user_role()
-- Safely fetches the role of the currently authenticated user for RLS checks.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Query role from profiles based on currently logged in user ID
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(user_role, 'citizen');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ensure columns exist in case tables were created prior to Phase 7
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi'));
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi'));

-- -------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) ACTIVATION
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 7. RLS POLICIES: profiles
-- -------------------------------------------------------------------------
-- Citizens: Can SELECT their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id
    OR public.get_user_role() = 'authority'
);

-- Users can update their own phone or location
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Authority: Can SELECT and UPDATE all profiles
DROP POLICY IF EXISTS "profiles_authority_all" ON public.profiles;
CREATE POLICY "profiles_authority_all"
ON public.profiles
FOR ALL
USING (public.get_user_role() = 'authority')
WITH CHECK (public.get_user_role() = 'authority');

-- -------------------------------------------------------------------------
-- 8. RLS POLICIES: incidents
-- -------------------------------------------------------------------------
-- Citizens: Can INSERT new emergency incidents & SELECT their own reports
DROP POLICY IF EXISTS "incidents_citizen_insert" ON public.incidents;
CREATE POLICY "incidents_citizen_insert"
ON public.incidents
FOR INSERT
WITH CHECK (
    public.get_user_role() = 'citizen'
    OR public.get_user_role() = 'authority'
    OR auth.role() = 'authenticated'
    OR auth.role() = 'anon' -- Allows public unauthenticated emergency SOS calls
);

DROP POLICY IF EXISTS "incidents_citizen_select" ON public.incidents;
CREATE POLICY "incidents_citizen_select"
ON public.incidents
FOR SELECT
USING (
    reported_by = auth.uid()
    OR public.get_user_role() IN ('rescue', 'authority')
);

-- Rescue: Can SELECT all assigned incidents and UPDATE their status ('open' -> 'resolved')
DROP POLICY IF EXISTS "incidents_rescue_update" ON public.incidents;
CREATE POLICY "incidents_rescue_update"
ON public.incidents
FOR UPDATE
USING (public.get_user_role() IN ('rescue', 'authority'))
WITH CHECK (public.get_user_role() IN ('rescue', 'authority'));

-- Authority: Can SELECT, UPDATE, DELETE all incidents
DROP POLICY IF EXISTS "incidents_authority_all" ON public.incidents;
CREATE POLICY "incidents_authority_all"
ON public.incidents
FOR ALL
USING (public.get_user_role() = 'authority' OR auth.role() = 'service_role')
WITH CHECK (public.get_user_role() = 'authority' OR auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 9. RLS POLICIES: resources
-- -------------------------------------------------------------------------
-- Rescue: Can SELECT assigned resource tasks
DROP POLICY IF EXISTS "resources_rescue_select" ON public.resources;
CREATE POLICY "resources_rescue_select"
ON public.resources
FOR SELECT
USING (
    public.get_user_role() IN ('rescue', 'authority')
    OR auth.role() = 'service_role'
);

-- Authority: Full access (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "resources_authority_all" ON public.resources;
CREATE POLICY "resources_authority_all"
ON public.resources
FOR ALL
USING (public.get_user_role() = 'authority' OR auth.role() = 'service_role')
WITH CHECK (public.get_user_role() = 'authority' OR auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 10. RLS POLICIES: audit_logs
-- -------------------------------------------------------------------------
-- Authority: Can SELECT all audit logs for review in War Room
DROP POLICY IF EXISTS "audit_logs_authority_select" ON public.audit_logs;
CREATE POLICY "audit_logs_authority_select"
ON public.audit_logs
FOR SELECT
USING (public.get_user_role() = 'authority' OR auth.role() = 'service_role');

-- Server-side Edge Functions / Service Role: Can INSERT audit logs
DROP POLICY IF EXISTS "audit_logs_service_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_service_insert"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 11. AUTOMATIC PROFILE CREATION TRIGGER (Best Practice)
-- Automatically inserts a record into public.profiles whenever a new user
-- registers via Supabase Auth.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, phone, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, 'citizen@kurukshetra.org'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 12. OPTIONAL SAMPLE SEED DATA (For quick hackathon demonstration)
-- -------------------------------------------------------------------------
INSERT INTO public.resources (type, quantity, location_hub)
VALUES
    ('water', 5000, 'Central Logistics Hub Alpha'),
    ('food', 3000, 'Central Logistics Hub Alpha'),
    ('medical', 250, 'North Medical Supply Depot'),
    ('tent', 120, 'South Airfield Warehouse')
ON CONFLICT DO NOTHING;
