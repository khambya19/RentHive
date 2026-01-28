// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables immediately
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); //
// Import Models
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

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const connectedUsers = new Map();
module.exports = { io, connectedUsers };

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite Frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reviews', reviewRoutes); //
app.use('/api/bikes', bikeRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/lessors', require('./routes/lessorRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Static files for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('RentHive API is Live'));

// --- Database & Server Start ---
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
    
    // Associations
    User.hasMany(Property, { foreignKey: 'vendorId', as: 'properties' });
    Property.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
    Property.hasMany(Booking, { foreignKey: 'propertyId', as: 'bookings' });
    Booking.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
    Booking.belongsTo(User, { foreignKey: 'tenantId', as: 'tenant' });
    
    // Sync Database (alter: true updates tables without deleting data)
    await sequelize.sync({ alter: true });
    console.log('✅ DB synced');
    
    // Initialize Payment Schedulers
    try {
        const paymentScheduler = require('./services/paymentScheduler');
        const schedule = require('node-schedule');
        schedule.scheduleJob('0 0 * * *', async () => {
          await paymentScheduler.createMonthlyPayments();
          await paymentScheduler.checkOverduePayments();
        });
        console.log('✅ Schedulers active');
    } catch (e) {
        console.log('⚠️ Scheduler service missing, skipping...');
    }

    // FORCE PORT 3001
    const PORT = 3001; 
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();

// Global Error Handlers
process.on('unhandledRejection', (reason) => console.error('❌ Unhandled Rejection:', reason));
process.on('uncaughtException', (error) => console.error('❌ Uncaught Exception:', error));