// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables early
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Models for associations
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

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

// Connected users map: userId (string) → socket.id
const connectedUsers = new Map();

// Export for controllers
module.exports = { io, connectedUsers };

// CORS middleware (very permissive for localhost dev)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    const allowed = [
      'http://localhost:3000', 'http://localhost:3001',
      'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
      'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
      'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175',
    ];
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.send('RentHive API'));

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('register', (userId) => {
    if (!userId) {
      console.warn('⚠️ Register attempt without userId from socket:', socket.id);
      return;
    }

    const userIdStr = userId.toString();

    // Optional: handle existing registration
    const existingSocketId = connectedUsers.get(userIdStr);
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`ℹ️ User ${userId} was already registered on ${existingSocketId} — updating to ${socket.id}`);
    }

    socket.userId = userIdStr;
    socket.join(`user_${userIdStr}`);
    connectedUsers.set(userIdStr, socket.id);

    console.log(`👤 User ${userId} registered to socket ${socket.id}`);
    console.log(`📊 Total connected users: ${connectedUsers.size}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`👋 User ${socket.userId} disconnected`);
    }
    console.log('❌ Client disconnected:', socket.id);
    console.log(`📊 Total connected users: ${connectedUsers.size}`);
  });
});

// Start server & DB
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Model associations
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

    // Sync DB (safe mode - no force/alter unless you really need it)
    await sequelize.sync(); // ← safe sync, won't drop tables
    console.log('✅ Database synced');

    // Payment scheduler
    const paymentScheduler = require('./services/paymentScheduler');
    const schedule = require('node-schedule');

    // Daily at midnight
    schedule.scheduleJob('0 0 * * *', async () => {
      console.log('🕒 Running daily payment scheduler...');
      await paymentScheduler.createMonthlyPayments();
      await paymentScheduler.checkOverduePayments();
    });

    // Reminders at 8 AM & 4 PM
    schedule.scheduleJob('0 8,16 * * *', async () => {
      console.log('🕒 Running payment reminder scheduler...');
      await paymentScheduler.sendUpcomingPaymentReminders();
    });

    console.log('✅ Payment scheduler initialized');

    const port = process.env.PORT || 5001;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('✅ Server is ready');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();

// Graceful error logging
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});