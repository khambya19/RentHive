const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔧 Fixing weeklyRate column constraint...');
    
    await pool.query('ALTER TABLE bikes ALTER COLUMN "weeklyRate" DROP NOT NULL;');
    
    console.log('✅ weeklyRate constraint removed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
