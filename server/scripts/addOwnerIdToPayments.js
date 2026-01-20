const sequelize = require('../config/db');

async function addOwnerIdColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');
    
    // Check if owner_id column exists
    const [checkResult] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'owner_id'
    `);
    
    if (checkResult.length > 0) {
      console.log('✅ owner_id column already exists');
    } else {
      console.log('Adding owner_id column to payments table...');
      
      await sequelize.query(`
        ALTER TABLE payments 
        ADD COLUMN owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE
      `);
      
      console.log('✅ Successfully added owner_id column');
      
      // Update existing records to set owner_id from booking
      console.log('Updating existing payment records...');
      await sequelize.query(`
        UPDATE payments p
        SET owner_id = (
          SELECT pr."vendorId" 
          FROM bookings b 
          INNER JOIN properties pr ON b."propertyId" = pr.id 
          WHERE b.id = p.booking_id
        )
        WHERE p.booking_id IS NOT NULL
      `);
      console.log('✅ Updated existing payment records');
    }
    
    // Show current table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 PAYMENTS TABLE STRUCTURE:');
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    await sequelize.close();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addOwnerIdColumn();
