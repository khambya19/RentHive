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
// Lessor Registration Route: POST /api/register-lessor
// =========================================================
app.post('/api/register-lessor', uploadMiddleware, async (req, res) => {
    try {
        const { 
            fullName, email, phone, password, 
            address, citizenshipNumber 
        } = req.body;
        
        const photoPath = req.file ? req.file.path : null; 
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const text = `
            INSERT INTO lessors 
            (full_name, email, phone_number, password_hash, address, citizenship_number, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, full_name, email;
        `;
        const values = [
            fullName, 
            email, 
            phone, 
            passwordHash, 
            address, 
            citizenshipNumber || null,
            photoPath 
        ];
        
        const result = await db.query(text, values);
        
        res.status(201).json({ 
            message: 'Lessor registered successfully!', 
            lessor: result.rows[0]
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
// Unified Login Route: POST /api/auth/login
// =========================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Try to find user in vendors table first
        let userQuery = 'SELECT id, email, password_hash, full_name, \'vendor\' as user_type FROM vendors WHERE email = $1';
        let result = await db.query(userQuery, [email]);

        // If not found in vendors, try lessors table
        if (result.rows.length === 0) {
            console.log('Not found in vendors, checking lessors...');
            userQuery = 'SELECT id, email, password_hash, full_name, \'lessor\' as user_type FROM lessors WHERE email = $1';
            result = await db.query(userQuery, [email]);
        } else {
            console.log('Found in vendors table');
        }

        if (result.rows.length === 0) {
            console.log('User not found in any table');
            return res.status(401).json({ msg: 'Invalid credentials. Email not found.' });
        }

        const user = result.rows[0];
        console.log('User found, comparing password...');

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid credentials. Incorrect password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.user_type },
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: '1h' }
        );
        
        console.log('Login successful for:', email);
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                user_type: user.user_type
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ msg: 'Server error during login.' });
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


// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});


// Start Server
app.listen(PORT, () => {
    console.log(`📡 Backend Server running on http://localhost:${PORT}`);
});