// Run database migration
require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'migrations', '001_create_users_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Executing migration...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Users table created');
    
    // Verify table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: users table exists in database');
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    pool.end();
    process.exit(1);
  }
}

runMigration();
