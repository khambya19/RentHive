const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const email = process.argv[2] || 'thapamanish554@gmail.com';

(async () => {
  const client = await pool.connect();
  
  try {
    console.log('Checking current database schema...\n');
    
    // Check if name column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'name'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('⚠️  "name" column does not exist. Adding it...');
      
      // First, add the column as nullable
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)');
      console.log('✅ Added "name" column');
      
      // Update existing rows - copy from fullName or use email
      await client.query(`
        UPDATE users 
        SET name = COALESCE(
          "fullName", 
          split_part(email, '@', 1)
        )
        WHERE name IS NULL
      `);
      console.log('✅ Populated "name" for existing users');
      
      // Now make it NOT NULL
      await client.query('ALTER TABLE users ALTER COLUMN name SET NOT NULL');
      console.log('✅ Set "name" column to NOT NULL');
    } else {
      console.log('✅ "name" column already exists');
    }
    
    // Check user
    const userResult = await client.query(
      'SELECT id, email, name, type, "isVerified" FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`\n❌ User not found: ${email}`);
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log('\n📋 User Details:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Type:', user.type);
    console.log('isVerified:', user.isVerified);
    
    if (user.isVerified) {
      console.log('\n✅ User is already verified');
    } else {
      console.log('\n⚠️  User is NOT verified. Verifying now...');
      
      await client.query(
        'UPDATE users SET "isVerified" = true, otp = NULL, "otpExpiry" = NULL WHERE email = $1',
        [email]
      );
      
      console.log('✅ User verified successfully!');
    }
    
    console.log('\n🎉 You can now login with your credentials!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
})();
