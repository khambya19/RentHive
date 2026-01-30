const sequelize = require('../config/db');

async function fixBikeTypes() {
  try {
    // First, let's see all bikes with invalid types
    const [allBikes] = await sequelize.query(`
      SELECT id, brand, model, type, name 
      FROM bikes 
      WHERE type NOT IN ('Motorcycle', 'Scooter', 'Electric Bike', 'Bicycle')
    `);
    
    console.log('Bikes with invalid types:', allBikes);
    
    if (allBikes.length > 0) {
      // Update all invalid types to 'Scooter' as default
      const [result] = await sequelize.query(`
        UPDATE bikes 
        SET type = 'Scooter' 
        WHERE type NOT IN ('Motorcycle', 'Scooter', 'Electric Bike', 'Bicycle')
      `);
      
      console.log('✅ Fixed bike types!');
      
      // Show updated bikes
      const [updated] = await sequelize.query('SELECT id, brand, model, type, name FROM bikes');
      console.log('All bikes now:', updated);
    } else {
      console.log('✅ No bikes with invalid types found');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

fixBikeTypes();
