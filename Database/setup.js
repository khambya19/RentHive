// Setup database and run migrations
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
 
  const adminClient = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT),
  });

  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await adminClient.connect();

   
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.PGDATABASE]
    );

    if (result.rows.length === 0) {
      console.log(`📝 Creating database "${process.env.PGDATABASE}"...`);
      await adminClient.query(`CREATE DATABASE ${process.env.PGDATABASE}`);
      console.log(`✅ Database "${process.env.PGDATABASE}" created successfully!`);
    } else {
      console.log(`✅ Database "${process.env.PGDATABASE}" already exists`);
    }

    await adminClient.end();

   
    const { Pool } = require('pg');
    const pool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: parseInt(process.env.PGPORT),
    });

    console.log('🔄 Running migrations...');
    
    
    const sql1 = fs.readFileSync(path.join(__dirname, 'migrations', '001_create_users_table.sql'), 'utf8');
    await pool.query(sql1);
    console.log('✅ Users table created/verified');

    
    const sql2 = fs.readFileSync(path.join(__dirname, 'migrations', '002_create_vendors_table.sql'), 'utf8');
    await pool.query(sql2);
    console.log('✅ Vendors table created/verified');

    console.log('✅ Database setup completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
