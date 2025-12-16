// User model using pg pool
const pool = require('../config/database');

const User = {
  async findOne(options) {
    const { where } = options;
    if (where.email) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [where.email]);
      return result.rows[0] || null;
    }
    return null;
  },

  async create(userData) {
    const { email, password, fullName, lastName, phone, address, citizenshipNumber } = userData;
    const result = await pool.query(
      `INSERT INTO users (email, password, full_name, last_name, phone, address, citizenship_number, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
       RETURNING *`,
      [email, password, fullName, lastName, phone, address, citizenshipNumber]
    );
    return result.rows[0];
  }
};

module.exports = User;