// Vendor model using pg pool
const pool = require('../config/database');

const Vendor = {
  async findOne(options) {
    const { where } = options;
    if (where.email) {
      const result = await pool.query('SELECT * FROM vendors WHERE email = $1', [where.email]);
      return result.rows[0] || null;
    }
    return null;
  },

  async create(vendorData) {
    const { fullName, email, phoneNumber, password, address, businessName, ownershipType, photo } = vendorData;
    const result = await pool.query(
      `INSERT INTO vendors (full_name, email, phone_number, password_hash, address, business_name, ownership_type, photo_url, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
       RETURNING *`,
      [fullName, email, phoneNumber, password, address, businessName, ownershipType, photo]
    );
    return result.rows[0];
  }
};

module.exports = Vendor;
