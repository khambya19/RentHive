const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function checkAndFixDatabase() {
  try {
    // Check if users table exists
    console.log('Checking users table...');
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ Users table does not exist. Creating it...');
      
      // Read and execute migration
      const migrationPath = path.join(__dirname, '../../Database/migrations/001_create_users_table.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await pool.query(migrationSQL);
      console.log('✓ Users table created successfully');
    } else {
      console.log('✓ Users table exists with columns:');
      tableCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
      
      // Check for required columns
      const columnNames = tableCheck.rows.map(r => r.column_name);
      const requiredColumns = ['email', 'password', 'full_name', 'last_name', 'phone', 'address', 'citizenship_number'];
      
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n❌ Missing required columns:', missingColumns.join(', '));
        console.log('Dropping and recreating table...');
        
        await pool.query('DROP TABLE IF EXISTS users CASCADE;');
        
        const migrationPath = path.join(__dirname, '../../Database/migrations/001_create_users_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        await pool.query(migrationSQL);
        console.log('✓ Users table recreated successfully');
      } else {
        console.log('✓ All required columns are present');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database check/fix failed:', error.message);
    process.exit(1);
  }
}

checkAndFixDatabase();
