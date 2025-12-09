// RENTHIVE/server/server.js

const express = require('express');
const { connectDB, sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to DB and synchronize models (Ensure DB_NAME is set to RentHiveDB in .env)
connectDB();
// sequelize.sync(); // Uncomment to auto-create tables

// Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));