const sequelize = require('../config/db');

async function checkTable() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `);
    
    console.log('PAYMENTS TABLE COLUMNS:');
    results.forEach(r => {
      console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTable();
