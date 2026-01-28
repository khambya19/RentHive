const { Pool } = require('pg');

// This tells your code how to find your database
const pool = new Pool({
  user: 'achyutsubedi',           // Default username
  host: 'localhost',          // Your computer
  database: 'renthive_db',       // The name of the DB you will create
  password: '',  
  port:3001,                 // Default port
});

module.exports = pool;