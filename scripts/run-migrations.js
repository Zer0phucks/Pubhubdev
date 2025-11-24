const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database URL should be in environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  // DigitalOcean managed databases require SSL, and we need to accept their CA
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'create-do-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema SQL...');
    await pool.query(schemaSql);
    
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
