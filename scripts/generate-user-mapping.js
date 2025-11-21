#!/usr/bin/env node
/**
 * Generate User Mapping File
 * Exports Supabase user IDs and helps create a mapping to Clerk user IDs
 * 
 * Usage:
 *   node scripts/generate-user-mapping.js --supabase-db-url <url> --output <json-file>
 */

const { Client } = require('pg');
const fs = require('fs');

async function generateUserMapping(supabaseUrl, outputFile) {
  console.log('=== Generating User Mapping File ===\n');

  const client = new Client({ connectionString: supabaseUrl });

  try {
    await client.connect();
    console.log('✓ Connected to Supabase database\n');

    // Get all users from Supabase
    const result = await client.query(`
      SELECT 
        id,
        email,
        raw_user_meta_data->>'name' as name,
        created_at
      FROM auth.users
      ORDER BY created_at
    `);

    console.log(`Found ${result.rows.length} users in Supabase\n`);

    // Create mapping template
    const mapping = {};
    const userList = [];

    result.rows.forEach((user, index) => {
      mapping[user.id] = `CLERK_USER_ID_${index + 1}`; // Placeholder
      userList.push({
        supabase_id: user.id,
        email: user.email,
        name: user.name,
        clerk_id_placeholder: `CLERK_USER_ID_${index + 1}`
      });
    });

    // Write mapping file
    fs.writeFileSync(outputFile, JSON.stringify(mapping, null, 2));
    console.log(`✓ Mapping template written to ${outputFile}\n`);

    // Write detailed user list for reference
    const userListFile = outputFile.replace('.json', '-details.json');
    fs.writeFileSync(userListFile, JSON.stringify(userList, null, 2));
    console.log(`✓ User details written to ${userListFile}\n`);

    console.log('Next Steps:');
    console.log('1. Open the mapping file and replace CLERK_USER_ID_* placeholders with actual Clerk user IDs');
    console.log('2. You can find Clerk user IDs in your Clerk dashboard');
    console.log('3. Match users by email address');
    console.log('4. Run: node scripts/map-user-ids.js --supabase-db-url <url> --do-db-url <url> --mapping-file <json>');

  } catch (error) {
    console.error('Error generating mapping:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const supabaseUrl = args.find(arg => arg.startsWith('--supabase-db-url='))?.split('=')[1];
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'user-mapping.json';

if (!supabaseUrl) {
  console.error('Usage: node scripts/generate-user-mapping.js --supabase-db-url=<url> [--output=<file>]');
  process.exit(1);
}

generateUserMapping(supabaseUrl, outputFile).catch(console.error);

