DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename NOT IN ('spatial_ref_sys') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_filters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_saved_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.b2b_aggregated_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.search_telemetry DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.publisher_profiles DISABLE ROW LEVEL SECURITY;
