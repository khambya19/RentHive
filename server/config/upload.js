const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const profilesDir = path.join(__dirname, '../uploads/profiles');
const propertiesDir = path.join(__dirname, '../uploads/properties');
const bikesDir = path.join(__dirname, '../uploads/bikes');

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

if (!fs.existsSync(propertiesDir)) {
  fs.mkdirSync(propertiesDir, { recursive: true });
}

if (!fs.existsSync(bikesDir)) {
  fs.mkdirSync(bikesDir, { recursive: true });
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

// Configure storage for bike images
const bikeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/bikes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bike-' + uniqueSuffix + path.extname(file.originalname));
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

// Property upload (up to 50 images, 20MB each)
const propertyUpload = multer({ 
  storage: propertyStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit per file
});

// Bike upload (up to 50 images, 20MB each)
const bikeUpload = multer({ 
  storage: bikeStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit per file
});

module.exports = profileUpload;
module.exports.profileUpload = profileUpload;
module.exports.propertyUpload = propertyUpload;
module.exports.bikeUpload = bikeUpload;
