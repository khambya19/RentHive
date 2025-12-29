
// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const PropertyView = require('./models/PropertyView');
const Inquiry = require('./models/Inquiry'); 

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/properties', propertyRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('RentHive API'));

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    
    // Define model associations
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
    
    // Use { force: true } to drop and recreate tables (WARNING: deletes all data!)
    // Use { alter: true } to modify existing tables (may cause errors with existing data)
    // Use {} for no changes, just connect
    await sequelize.sync(); // Changed from { force: true } to preserve user data
    console.log('DB synced');

    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
