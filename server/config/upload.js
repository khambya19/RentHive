const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const profilesDir = path.join(__dirname, '../uploads/profiles');
const propertiesDir = path.join(__dirname, '../uploads/properties');

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

if (!fs.existsSync(propertiesDir)) {
  fs.mkdirSync(propertiesDir, { recursive: true });
}

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for property images
const propertyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/properties/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Profile upload
const profileUpload = multer({ 
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Property upload (up to 10 images, 10MB each)
const propertyUpload = multer({ 
  storage: propertyStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

module.exports = profileUpload;
module.exports.profileUpload = profileUpload;
module.exports.propertyUpload = propertyUpload;
