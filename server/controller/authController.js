// RENTHIVE/server/controller/authController.js

const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Uncomment if using Nodemailer for email sending
// const nodemailer = require('nodemailer'); 
// const crypto = require('crypto'); 

// 1. USER LOGIN
const loginUser = async (req, res) => {
    const { email, password } = req.body; 

    try {
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        // Generate JWT
        const payload = { user: { id: user.id } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Make sure JWT_SECRET is in your .env
            { expiresIn: '1h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, msg: 'Login successful' });
            }
        );
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).send('Server Error during login');
    }
};

// 2. FORGOT PASSWORD (OTP Request)
const forgotPassword = async (req, res) => {
    const { identifier } = req.body; 

    try {
        let user;
        // In a real application, you'd find the user by email or phone.
        
        // Find user by email (assuming identifier is email for simplicity here)
        user = await User.findOne({ where: { email: identifier } }); 

        if (!user) {
            // Security Best Practice: Always return a generic success message
            return res.json({ msg: 'If the identifier is valid, a reset code has been sent.' });
        }

        // --- OTP/Email Sending Logic Goes Here ---
        // 1. Generate resetCode (OTP).
        // 2. Save resetCode and expiry time to the user record in the database.
        // 3. Use Nodemailer/SMS gateway to send the code to user.email or user.phone.
        // -----------------------------------------
        
        console.log(`[MOCK OTP] Generated code for ${identifier}`);

        res.json({ msg: 'A temporary reset code has been sent to your registered email.' });

    } catch (err) {
        console.error("Forgot Password Error:", err.message);
        res.status(500).send('Server Error during password request');
    }
};

// 3. USER REGISTRATION (Next planned feature)
const registerUser = async (req, res) => {
    // This is the implementation placeholder for the User registration feature.
    // It will handle hashing the password and saving the new user to the database.
    res.status(501).json({ msg: 'Registration feature not yet implemented.' });
};


// CRITICAL FIX: EXPORT ALL DEFINED FUNCTIONS CORRECTLY
// This ensures the router (auth.js) receives functions, resolving the TypeError.
module.exports = { 
    loginUser, 
    forgotPassword,
    registerUser
};