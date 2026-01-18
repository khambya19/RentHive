const { Sequelize } = require('sequelize');
const Property = require('./models/Property');

const sequelize = new Sequelize('renthive', 'rojenkhadka', '', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

(async () => {
  try {
    const properties = await Property.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1
    });
    
    if (properties.length > 0) {
      const prop = properties[0].toJSON();
      console.log('\n=== Latest Property Data ===');
      console.log('ID:', prop.id);
      console.log('Title:', prop.title);
      console.log('Rent Price:', prop.rentPrice, '(Type:', typeof prop.rentPrice + ')');
      console.log('Images:', JSON.stringify(prop.images, null, 2));
      console.log('Image type:', typeof prop.images);
      console.log('Is Array:', Array.isArray(prop.images));
      console.log('First image:', prop.images?.[0]);
    } else {
      console.log('No properties found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
