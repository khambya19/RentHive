const User = require('../models/User');
const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. USER LOGIN
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
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

// VENDOR LOGIN
const loginVendor = async (req, res) => {
    const { email, password } = req.body;

    try {
        const vendor = await Vendor.findOne({ where: { email } });

        if (!vendor) {
            return res.status(401).json({ message: 'Invalid credentials. (Email not found)' });
        }

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
                fullName: vendor.full_name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

const forgotPassword = async (req, res) => {
    const { identifier } = req.body;

    try {
        let user;

        user = await User.findOne({ where: { email: identifier } });

        if (!user) {
            return res.json({ msg: 'If the identifier is valid, a reset code has been sent.' });
        }

        console.log(`[MOCK OTP] Generated code for ${identifier}`);

        res.json({ msg: 'A temporary reset code has been sent to your registered email.' });

    } catch (err) {
        console.error("Forgot Password Error:", err.message);
        res.status(500).send('Server Error during password request');
    }
};

const registerUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
        const newUser = await User.create({
            email,
            password: hashedPassword
        });

        
        const payload = { user: { id: newUser.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token, msg: 'User registered successfully' });
            }
        );
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ msg: 'Server Error during registration' });
    }
};


const registerVendor = async (req, res) => {
    const { fullName, email, phoneNumber, password, confirmPassword, address, businessName, ownershipType } = req.body;

    try {
        console.log('Registering vendor:', { fullName, email, phoneNumber, address, businessName, ownershipType });
        console.log('File:', req.file);
        console.log('JWT_SECRET:', process.env.JWT_SECRET);

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }

       
        const existingVendor = await Vendor.findOne({ where: { email } });
        if (existingVendor) {
            return res.status(400).json({ message: 'Vendor already exists' });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

       
        let photoPath = null;
        if (req.file) {
            photoPath = req.file.path; 
        }

        console.log('Creating vendor with:', { fullName, email, phoneNumber, passwordHash: hashedPassword, address, businessName, ownershipType, photoUrl: photoPath });

       
        const newVendor = await Vendor.create({
            full_name: fullName,
            email,
            phone_number: phoneNumber,
            password_hash: hashedPassword,
            address,
            business_name: businessName,
            ownership_type: ownershipType,
            photo_url: photoPath
        });

        console.log('Vendor created:', newVendor);

        
        const payload = { vendor: { id: newVendor.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    vendor: {
                        id: newVendor.id,
                        fullName: newVendor.full_name,
                        email: newVendor.email
                    },
                    token,
                    message: 'Vendor registered successfully'
                });
            }
        );
    } catch (err) {
        console.error("Vendor Registration Error:", err.message);
        console.error("Full error:", err);
        res.status(500).json({ message: 'Server Error during vendor registration' });
    }
};


module.exports = {
    loginUser,
    loginVendor,
    forgotPassword,
    registerUser,
    registerVendor
};
