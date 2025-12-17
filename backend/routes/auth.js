const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const {
    loginUser,
    loginVendor,
    forgotPassword,
    registerUser,
    registerVendor
} = require('../controller/authController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Routes
router.post('/login', loginUser);
router.post('/login-vendor', loginVendor);
router.post('/forgot-password', forgotPassword);
router.post('/register', registerUser);
router.post('/register-vendor', upload.single('photo'), registerVendor);

module.exports = router;
