const Message = require('./Message');
const User = require('./User');
const Property = require('./Property');
const Bike = require('./Bike');

// Message associations
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
Message.belongsTo(Property, { as: 'property', foreignKey: 'propertyId' });
Message.belongsTo(Bike, { as: 'bike', foreignKey: 'bikeId' });

// Export all models
module.exports = {
  Message,
  User,
  Property,
  Bike
};
