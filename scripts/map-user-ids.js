#!/usr/bin/env node
/**
 * User ID Mapping Script
 * Maps Supabase auth.users IDs to Clerk user IDs after database migration
 * 
 * Usage:
 *   node scripts/map-user-ids.js --supabase-db-url <url> --do-db-url <url> --mapping-file <json>
 * 
 * Mapping file format (user-mapping.json):
 * {
 *   "supabase_user_id_1": "clerk_user_id_1",
 *   "supabase_user_id_2": "clerk_user_id_2"
 * }
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function mapUserIds(supabaseUrl, doUrl, mappingFile) {
  console.log('=== User ID Mapping Script ===\n');

  // Read mapping file
  if (!fs.existsSync(mappingFile)) {
    console.error(`Error: Mapping file not found: ${mappingFile}`);
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
  console.log(`Loaded ${Object.keys(mapping).length} user mappings\n`);

  // Connect to both databases
  const supabaseClient = new Client({ connectionString: supabaseUrl });
  const doClient = new Client({ connectionString: doUrl });

  try {
    await supabaseClient.connect();
    await doClient.connect();
    console.log('✓ Connected to both databases\n');

    // Step 1: Create users in DO database from mapping
    console.log('[1/3] Creating users in DigitalOcean database...');
    for (const [supabaseId, clerkId] of Object.entries(mapping)) {
      // Get user info from Supabase
      const userResult = await supabaseClient.query(
        'SELECT email, raw_user_meta_data FROM auth.users WHERE id = $1',
        [supabaseId]
      );

      if (userResult.rows.length === 0) {
        console.warn(`  ⚠ Supabase user ${supabaseId} not found, skipping`);
        continue;
      }

      const user = userResult.rows[0];
      const email = user.email;
      const name = user.raw_user_meta_data?.name || email?.split('@')[0] || 'User';

      // Insert or update user in DO database
      await doClient.query(
        `INSERT INTO users (clerk_user_id, email, name, id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (clerk_user_id) DO UPDATE
         SET email = EXCLUDED.email, name = EXCLUDED.name`,
        [clerkId, email, name, supabaseId]
      );

      console.log(`  ✓ Mapped ${supabaseId} → ${clerkId} (${email})`);
    }

    console.log('');

    // Step 2: Update user_id references in projects table
    console.log('[2/3] Updating user_id references in projects table...');
    const projectsResult = await doClient.query('SELECT id, user_id FROM projects');
    let updated = 0;

    for (const project of projectsResult.rows) {
      const newUserId = mapping[project.user_id];
      if (newUserId) {
        // Get the new user's internal ID
        const userResult = await doClient.query(
          'SELECT id FROM users WHERE clerk_user_id = $1',
          [newUserId]
        );

        if (userResult.rows.length > 0) {
          const newInternalId = userResult.rows[0].id;
          await doClient.query(
            'UPDATE projects SET user_id = $1 WHERE id = $2',
            [newInternalId, project.id]
          );
          updated++;
        }
      }
    }

    console.log(`  ✓ Updated ${updated} projects\n`);

    // Step 3: Update other tables that reference user_id
    console.log('[3/3] Updating other user_id references...');
    
    // Update personas.created_by
    const personasResult = await doClient.query(
      'SELECT id, created_by FROM personas WHERE created_by IS NOT NULL'
    );
    let personasUpdated = 0;

    for (const persona of personasResult.rows) {
      const newUserId = mapping[persona.created_by];
      if (newUserId) {
        const userResult = await doClient.query(
          'SELECT id FROM users WHERE clerk_user_id = $1',
          [newUserId]
        );

        if (userResult.rows.length > 0) {
          await doClient.query(
            'UPDATE personas SET created_by = $1 WHERE id = $2',
            [userResult.rows[0].id, persona.id]
          );
          personasUpdated++;
        }
      }
    }

    console.log(`  ✓ Updated ${personasUpdated} personas\n`);

    console.log('=== Mapping Complete ===\n');
    console.log('Next steps:');
    console.log('1. Verify data integrity: SELECT COUNT(*) FROM projects;');
    console.log('2. Test application with new database');
    console.log('3. Update application connection strings');

  } catch (error) {
    console.error('Error during mapping:', error);
    process.exit(1);
  } finally {
    await supabaseClient.end();
    await doClient.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const supabaseUrl = args.find(arg => arg.startsWith('--supabase-db-url='))?.split('=')[1];
const doUrl = args.find(arg => arg.startsWith('--do-db-url='))?.split('=')[1];
const mappingFile = args.find(arg => arg.startsWith('--mapping-file='))?.split('=')[1];

if (!supabaseUrl || !doUrl || !mappingFile) {
  console.error('Usage: node scripts/map-user-ids.js --supabase-db-url=<url> --do-db-url=<url> --mapping-file=<json>');
  process.exit(1);
}

mapUserIds(supabaseUrl, doUrl, mappingFile).catch(console.error);

