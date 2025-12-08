const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const uploadMiddleware = require('./upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use('/uploads', express.static('uploads')); 

// =========================================================
// Vendor Registration Route: POST /api/register-vendor
// =========================================================
app.post('/api/register-vendor', uploadMiddleware, async (req, res) => {
    try {
        const { 
            fullName, email, phoneNumber, password, confirmPassword, 
            businessName, address, ownershipType 
        } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
        
        const photoPath = req.file ? req.file.path : null; 
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const text = `
            INSERT INTO vendors 
            (full_name, email, phone_number, password_hash, business_name, address, ownership_type, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, full_name, email;
        `;
        const values = [
            fullName, 
            email, 
            phoneNumber, 
            passwordHash, 
            businessName || null, 
            address, 
            ownershipType, 
            photoPath 
        ];
        
        const result = await db.query(text, values);
        
        res.status(201).json({ 
            message: 'Vendor registered successfully!', 
            vendor: result.rows[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') { 
            return res.status(409).json({ message: 'Email address is already in use.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});


// =========================================================
// Vendor Login Route: POST /api/login-vendor
// =========================================================
app.post('/api/login-vendor', async (req, res) => {
    try {
        const { email, password } = req.body;

        const vendorQuery = 'SELECT id, email, password_hash, full_name FROM vendors WHERE email = $1';
        const result = await db.query(vendorQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials. (Email not found)' });
        }

        const vendor = result.rows[0];

        const isMatch = await bcrypt.compare(password, vendor.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials. (Incorrect password)' });
        }

        const token = jwt.sign(
            { id: vendor.id, email: vendor.email },
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            vendor: {
                id: vendor.id,
                email: vendor.email,
                full_name: vendor.full_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`📡 Backend Server running on http://localhost:${PORT}`);
});