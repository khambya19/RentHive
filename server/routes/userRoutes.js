const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const upload = require('../config/upload');

// Register new user (lessor/renter) with profile photo
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { fullName, lastName, email, phone, password, address, citizenshipNumber, role } = req.body;

    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get uploaded file path
    const profilePhoto = req.file ? req.file.filename : null;

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, address, citizenship_number, profile_photo, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       RETURNING id, name, email, phone, role, profile_photo, created_at`,
      [`${fullName} ${lastName}`, email, hashedPassword, phone, role || 'lessor', address, citizenshipNumber, profilePhoto]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, role, created_at FROM users');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, name, email, phone, role, address, created_at FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
