const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'renthive_db',
  password: 'viscabarca',
  port: 5432,
});

async function createLessorsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS lessors (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        citizenship_number VARCHAR(50),
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_lessors_email ON lessors(email);
    `;

    await pool.query(query);
    console.log('✅ Lessors table created successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating lessors table:', error);
    await pool.end();
    process.exit(1);
  }
}

createLessorsTable();
