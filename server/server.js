// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables early
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');
// Import models for associations and usage
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const PropertyView = require('./models/PropertyView');
const Inquiry = require('./models/Inquiry');
const Bike = require('./models/Bike');
const BikeBooking = require('./models/BikeBooking');
const Payment = require('./models/Payment');
const Message = require('./models/Message');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicRoutes = require('./routes/publicRoutes');
const messageRoutes = require('./routes/messageRoutes');



// Create Express app and HTTP server
const app = express();
// Enable CORS for all origins (adjust as needed for production)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// Parse JSON bodies
app.use(express.json());

// Serve static uploads (images)
app.use('/uploads/properties', express.static(path.join(__dirname, 'uploads/properties')));
app.use('/uploads/bikes', express.static(path.join(__dirname, 'uploads/bikes')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));

// Mount API routes - Public routes first (no auth required)
app.use('/api/public', publicRoutes);

// Protected routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes/controllers
app.set('io', io);

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('register', (userId) => {
    if (!userId) {
      console.warn('⚠️ Register attempt without userId from socket:', socket.id);
      return;
    }

    const userIdStr = userId.toString();
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

          // Messages
          Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
          Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
          Message.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
          Message.belongsTo(Bike, { foreignKey: 'bikeId', as: 'bike' });
          User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
          User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });

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





// Global Error Handlers
process.on('unhandledRejection', (reason) => console.error('❌ Unhandled Rejection:', reason));
process.on('uncaughtException', (error) => console.error('❌ Uncaught Exception:', error));
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});
