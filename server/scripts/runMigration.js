// Run database migration from server directory
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, '../../Database/migrations/001_create_users_table.sql');
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
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    pool.end();
    process.exit(1);
  }
}

runMigration();
