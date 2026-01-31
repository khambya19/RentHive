// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables early
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');
const User = require('./models/User');
// ... other models ...
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

// Routes
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reportRoutes = require('./routes/reportRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const port = process.env.PORT || 5050; // Read port once

// Express Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads/properties', express.static(path.join(__dirname, 'uploads/properties')));
app.use('/uploads/bikes', express.static(path.join(__dirname, 'uploads/bikes')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true 
});

app.set('io', io);

// Mount API routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);

app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', require('./routes/chatRoutes'));

// Socket.IO Logic
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('register', (userData) => {
    const userId = typeof userData === 'object' ? userData.userId : userData;
    const role = typeof userData === 'object' ? userData.role : null;

    if (!userId) return;

    const userIdStr = userId.toString();
    socket.userId = userIdStr;
    socket.join(`user_${userIdStr}`);

    if (role === 'super_admin') {
      socket.join('admins');
    }

    connectedUsers.set(userIdStr, socket.id);
    console.log(`👤 User ${userId} registered to socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Database and Server Start
const startServer = async () => {
  try {
    // Auth and sync
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Model associations (kept from original)
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
    User.hasMany(Bike, { foreignKey: 'vendorId', as: 'bikes' });
    Bike.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    User.hasMany(BikeBooking, { foreignKey: 'lessorId', as: 'lessorBikeBookings' });
    User.hasMany(BikeBooking, { foreignKey: 'vendorId', as: 'vendorBikeBookings' });
    Bike.hasMany(BikeBooking, { foreignKey: 'bikeId', as: 'bookings' });
    BikeBooking.belongsTo(Bike, { foreignKey: 'bikeId', as: 'bike' });
    BikeBooking.belongsTo(User, { foreignKey: 'lessorId', as: 'lessor' });
    BikeBooking.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    Payment.belongsTo(Booking, { foreignKey: 'bookingId' });
    Payment.belongsTo(BikeBooking, { foreignKey: 'bikeBookingId', as: 'bikeBooking' });
    Payment.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
    Payment.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
    User.hasMany(BookingApplication, { foreignKey: 'userId', as: 'applications' });
    BookingApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
    Booking.hasMany(Payment, { foreignKey: 'bookingId' });
    BikeBooking.hasMany(Payment, { foreignKey: 'bikeBookingId' });
    Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
    Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
    Message.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
    Message.belongsTo(Bike, { foreignKey: 'bikeId', as: 'bike' });
    User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
    User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
    Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
    User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });

    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // Scheduler
    require('./services/paymentScheduler');
    const schedule = require('node-schedule');
    schedule.scheduleJob('0 0 * * *', async () => {
      const paymentScheduler = require('./services/paymentScheduler');
      await paymentScheduler.createMonthlyPayments();
      await paymentScheduler.checkOverduePayments();
      await paymentScheduler.checkAndCloseCompletedRentals();
    });

    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log('✅ Socket.IO initialized and listening');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Only start the server when not running tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Global Handlers
process.on('unhandledRejection', (reason) => console.error('❌ Unhandled Rejection:', reason));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (error.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

module.exports = { app, server, io };
