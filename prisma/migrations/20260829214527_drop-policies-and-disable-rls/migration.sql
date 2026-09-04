DO $$
DECLARE
  r record;
  pol record;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = r.tablename LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, r.tablename);
    END LOOP;
    EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;
