# Database Migration Guide: Supabase to DigitalOcean

This guide walks you through migrating your database from Supabase to DigitalOcean Managed PostgreSQL.

## Prerequisites

1. **DigitalOcean Database Created**
   - Create a Managed PostgreSQL database named "pubhub-db" in your DigitalOcean account
   - Note the connection string (format: `postgresql://user:password@host:port/database`)

2. **Supabase Connection String**
   - Get your Supabase database connection string from the Supabase dashboard
   - Format: `postgresql://postgres:[password]@[host]:[port]/postgres`

3. **Tools Installed**
   - `pg_dump` and `psql` (PostgreSQL client tools)
   - Node.js (for user ID mapping script)

## Migration Steps

### Step 1: Export from Supabase

**On Linux/Mac:**
```bash
export SUPABASE_DB_URL="postgresql://postgres:[password]@[supabase-host]:5432/postgres"
export DO_DB_URL="postgresql://[user]:[password]@[do-host]:25060/pubhub-db"

chmod +x scripts/migrate-to-digitalocean-db.sh
./scripts/migrate-to-digitalocean-db.sh
```

**On Windows (PowerShell):**
```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres:[password]@[supabase-host]:5432/postgres"
$env:DO_DB_URL = "postgresql://[user]:[password]@[do-host]:25060/pubhub-db"

.\scripts\migrate-to-digitalocean-db.ps1 -SupabaseDbUrl $env:SUPABASE_DB_URL -DoDbUrl $env:DO_DB_URL
```

The script will:
1. Export schema from Supabase (excluding auth/storage/realtime schemas)
2. Export data from Supabase tables
3. Prepare schema for DigitalOcean (removes Supabase-specific references)
4. Apply schema to DigitalOcean database
5. Import data to DigitalOcean
6. Verify migration by comparing row counts

### Step 2: Map User IDs (Supabase → Clerk)

Since we're migrating from Supabase Auth to Clerk, you need to map user IDs:

1. **Create a mapping file** (`user-mapping.json`):
```json
{
  "supabase-user-id-1": "clerk-user-id-1",
  "supabase-user-id-2": "clerk-user-id-2"
}
```

2. **Run the mapping script:**
```bash
npm install pg  # If not already installed

node scripts/map-user-ids.js \
  --supabase-db-url="postgresql://postgres:[password]@[supabase-host]:5432/postgres" \
  --do-db-url="postgresql://[user]:[password]@[do-host]:25060/pubhub-db" \
  --mapping-file="user-mapping.json"
```

This script will:
- Create users in the DigitalOcean `users` table with Clerk IDs
- Update `user_id` references in `projects` table
- Update `created_by` references in `personas` table

### Step 3: Update Application Configuration

1. **Update environment variables:**
   - Set `DATABASE_URL` to your DigitalOcean connection string
   - Remove Supabase-specific database variables

2. **Update connection code:**
   - The migration script creates a `users` table that maps Clerk IDs to internal user IDs
   - Your application should use Clerk user IDs and look them up in the `users` table

3. **Update RLS policies:**
   - The prepared schema uses `app.current_user_id` instead of `auth.uid()`
   - Your backend should call `set_current_user_id()` function before queries:
   ```sql
   SELECT set_current_user_id('user-uuid-here');
   ```

### Step 4: Verify Migration

Run these queries on both databases to verify:

```sql
-- Check table counts
SELECT 'projects' as table_name, COUNT(*) FROM projects
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'content_sources', COUNT(*) FROM content_sources
UNION ALL
SELECT 'persona_vectors', COUNT(*) FROM persona_vectors
UNION ALL
SELECT 'kv_store_19ccd85e', COUNT(*) FROM kv_store_19ccd85e;

-- Check user mappings
SELECT COUNT(*) FROM users;

-- Check projects have valid user_ids
SELECT COUNT(*) FROM projects p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;  -- Should be 0
```

## Schema Changes

The migration makes these key changes:

1. **Users Table**: New `users` table maps Clerk user IDs to internal UUIDs
2. **RLS Policies**: Updated to use `app.current_user_id` instead of `auth.uid()`
3. **Foreign Keys**: Changed from `REFERENCES auth.users(id)` to `REFERENCES users(id)`
4. **Extensions**: Ensures `uuid-ossp`, `vector`, and `pgcrypto` are enabled

## Troubleshooting

### Connection Issues
- Verify firewall rules allow your IP to connect to DigitalOcean database
- Check SSL mode (DigitalOcean requires SSL connections)

### User ID Mapping Errors
- Ensure all Supabase user IDs are mapped to Clerk user IDs
- Check that Clerk user IDs exist in your Clerk dashboard

### Data Import Errors
- Some errors may occur if foreign key constraints fail
- Check that referenced data exists before importing dependent tables
- You may need to import in order: users → projects → brands/personas → content_sources → persona_vectors

### RLS Policy Issues
- If queries fail with permission errors, ensure `set_current_user_id()` is called
- Check that user IDs in the database match Clerk user IDs

## Rollback Plan

If you need to rollback:
1. Keep Supabase database intact (don't delete it)
2. Point application back to Supabase connection string
3. Review migration logs to identify issues
4. Fix issues and re-run migration

## Post-Migration Checklist

- [ ] All tables migrated successfully
- [ ] User IDs mapped correctly
- [ ] RLS policies working
- [ ] Application connects to new database
- [ ] Test CRUD operations
- [ ] Test vector search (if using pgvector)
- [ ] Update production environment variables
- [ ] Monitor error logs for 24-48 hours
- [ ] Update documentation

## Support

If you encounter issues:
1. Check migration script output for specific errors
2. Verify connection strings are correct
3. Ensure all prerequisites are met
4. Review DigitalOcean database logs

