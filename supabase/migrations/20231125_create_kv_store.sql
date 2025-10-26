-- Create the kv_store table for key-value storage
CREATE TABLE IF NOT EXISTS public.kv_store_19ccd85e (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the key for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON public.kv_store_19ccd85e(key);

-- Create an updated_at trigger to automatically update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kv_store_updated_at
    BEFORE UPDATE ON public.kv_store_19ccd85e
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.kv_store_19ccd85e ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON public.kv_store_19ccd85e
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert data
CREATE POLICY "Allow authenticated insert" ON public.kv_store_19ccd85e
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update data
CREATE POLICY "Allow authenticated update" ON public.kv_store_19ccd85e
    FOR UPDATE
    TO authenticated
    USING (true);

-- Allow authenticated users to delete data
CREATE POLICY "Allow authenticated delete" ON public.kv_store_19ccd85e
    FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions to authenticated and anon users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kv_store_19ccd85e TO authenticated;
GRANT SELECT ON public.kv_store_19ccd85e TO anon;