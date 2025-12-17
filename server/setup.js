const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    // Create vendors table
    const sql = fs.readFileSync(path.join(__dirname, '../Database/migrations/002_create_vendors_table.sql'), 'utf8');
    await pool.query(sql);
    console.log('Vendors table created');
    pool.end();
  } catch (e) {
    console.error(e);
    pool.end();
  }
})();