// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables before anything else
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const testRoutes = require('./routes/testRoutes');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const PropertyView = require('./models/PropertyView');
const Inquiry = require('./models/Inquiry');
const Bike = require('./models/Bike');
const BikeBooking = require('./models/BikeBooking');
const Payment = require('./models/Payment');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/test', testRoutes); // Test endpoints for payment scheduler

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('RentHive API'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('register', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} registered to socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

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
    
    // Bike associations
    User.hasMany(Bike, { foreignKey: 'vendorId', as: 'bikes' });
    Bike.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    
    User.hasMany(BikeBooking, { foreignKey: 'lessorId', as: 'lessorBikeBookings' });
    User.hasMany(BikeBooking, { foreignKey: 'vendorId', as: 'vendorBikeBookings' });
    
    Bike.hasMany(BikeBooking, { foreignKey: 'bikeId', as: 'bookings' });
    BikeBooking.belongsTo(Bike, { foreignKey: 'bikeId', as: 'bike' });
    BikeBooking.belongsTo(User, { foreignKey: 'lessorId', as: 'lessor' });
    BikeBooking.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    
    // Payment relationships
    Payment.belongsTo(Booking, { foreignKey: 'bookingId' });
    Payment.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
    Payment.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
    Booking.hasMany(Payment, { foreignKey: 'bookingId' });
    
    // Use { force: true } to drop and recreate tables (WARNING: deletes all data!)
    // Use { alter: true } to modify existing tables (may cause errors with existing data)
    // Use {} for no changes, just connect
    await sequelize.sync(); // Changed from { force: true } to preserve user data
    console.log('DB synced');
    
    // Initialize payment scheduler (runs every day at midnight)
    const paymentScheduler = require('./services/paymentScheduler');
    const schedule = require('node-schedule');
    
    // Run daily at midnight
    schedule.scheduleJob('0 0 * * *', async () => {
      console.log('🕒 Running daily payment scheduler...');
      await paymentScheduler.createMonthlyPayments();
      await paymentScheduler.checkOverduePayments();
    });
    
    // Run reminder check twice daily (8 AM and 4 PM)
    schedule.scheduleJob('0 8,16 * * *', async () => {
      console.log('🕒 Running payment reminder scheduler...');
      await paymentScheduler.sendUpcomingPaymentReminders();
    });
    
    console.log('✅ Payment scheduler initialized');

    const port = process.env.PORT || 5001;
    const serverInstance = server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('✅ Server is ready to accept connections');
    });
    
    // Prevent server from exiting
    serverInstance.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
    // Keep process alive
    setInterval(() => {
      // Empty interval to keep the event loop running
    }, 1000 * 60 * 60); // Run every hour
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

// Add exit handler to debug
process.on('exit', (code) => {
  console.log(`❌ About to exit with code: ${code}`);
});

process.on('beforeExit', (code) => {
  console.log(`❌ Before exit with code: ${code}`);
});
