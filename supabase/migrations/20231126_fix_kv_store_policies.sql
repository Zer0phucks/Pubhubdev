-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read" ON public.kv_store_19ccd85e;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.kv_store_19ccd85e;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.kv_store_19ccd85e;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.kv_store_19ccd85e;

-- Temporarily disable RLS to ensure access
ALTER TABLE public.kv_store_19ccd85e DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated and anon users
GRANT ALL ON public.kv_store_19ccd85e TO authenticated;
GRANT ALL ON public.kv_store_19ccd85e TO anon;
GRANT ALL ON public.kv_store_19ccd85e TO service_role;

-- Make sure the table is accessible
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;