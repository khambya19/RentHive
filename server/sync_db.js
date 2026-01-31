const sequelize = require('./config/db');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const PropertyView = require('./models/PropertyView');
const Inquiry = require('./models/Inquiry');
const Bike = require('./models/Bike');
const BikeBooking = require('./models/BikeBooking');
const Payment = require('./models/Payment');
const Message = require('./models/Message');
const Report = require('./models/Report');
const BookingApplication = require('./models/BookingApplication');

async function syncDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Model associations (copied from server.js for safety)
        User.hasMany(Property, { foreignKey: 'vendorId', as: 'properties' });
        Property.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

        User.hasMany(Booking, { foreignKey: 'tenantId', as: 'tenantBookings' });
        User.hasMany(Booking, { foreignKey: 'vendorId', as: 'vendorBookings' });
        Property.hasMany(Booking, { foreignKey: 'propertyId', as: 'bookings' });
        Booking.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
        Booking.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
        Booking.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

        Property.hasMany(PropertyView, { foreignKey: 'propertyId', as: 'views' });
        PropertyView.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

        Property.hasMany(Inquiry, { foreignKey: 'propertyId', as: 'inquiries' });
        Inquiry.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
        Inquiry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

        // Bike associations
        User.hasMany(Bike, { foreignKey: 'vendorId', as: 'bikes' });
        Bike.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

        User.hasMany(BikeBooking, { foreignKey: 'lessorId', as: 'lessorBikeBookings' });
        User.hasMany(BikeBooking, { foreignKey: 'vendorId', as: 'vendorBikeBookings' });
        Bike.hasMany(BikeBooking, { foreignKey: 'bikeId', as: 'bookings' });
        BikeBooking.belongsTo(Bike, { foreignKey: 'bikeId', as: 'bike' });
        BikeBooking.belongsTo(User, { foreignKey: 'lessorId', as: 'lessor' });
        BikeBooking.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

        // Payments
        Payment.belongsTo(Booking, { foreignKey: 'bookingId' });
        Payment.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
        Payment.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
        Booking.hasMany(Payment, { foreignKey: 'bookingId' });

        // Messages
        Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
        Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
        Message.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
        Message.belongsTo(Bike, { foreignKey: 'bikeId', as: 'bike' });
        User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
        User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });

        // Reports
        Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
        User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });

        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

syncDB();
