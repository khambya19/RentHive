
// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User'); 

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('RentHive API'));

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync({ alter: true }); 
    console.log('DB synced');

    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
