const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'renthive_db',
  password: 'viscabarca',
  port: 5432,
});

async function checkUser() {
  try {
    const result = await pool.query("SELECT email, full_name FROM vendors WHERE email = 'unishkc99@gmail.com'");
    console.log('Vendors table:', result.rows);
    
    const result2 = await pool.query("SELECT email, full_name FROM lessors WHERE email = 'unishkc99@gmail.com'");
    console.log('Lessors table:', result2.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkUser();
