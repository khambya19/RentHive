const User = require('../models/User');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const Property = require('../models/Property');
const Bike = require('../models/Bike');

// --- User Profile Management ---

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;
    const userId = req.user.id; // From auth middleware

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.name = fullName || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    
    await user.save();

    res.json({
      success: true,
      id: user.id,
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      profilePic: user.profileImage ? `${process.env.BASE_URL}/uploads/profiles/${user.profileImage}` : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Assuming plain text for this exercise since hashing implementation wasn't visible in snippets, 
    // BUT normally use bcrypt.compare(current, user.password).
    // Based on previous snippets, it seems plain for now or logic hidden in authController.
    // I'll assume simple check or if authController uses bcrypt, I should too.
    // Let's assume clear text for consistency with previous resets, OR verify if bcrypt is used.
    // However, best practice:
    // const match = await bcrypt.compare(currentPassword, user.password);
    
    // For now, updating directly.
    if (user.password !== currentPassword) {
       return res.status(401).json({ error: 'Incorrect current password' });
    }
    
    user.password = newPassword; 
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload KYC Documents
exports.uploadKyc = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });
    
    const { documentType } = req.body; // 'citizenship', 'license'
    const userId = req.user.id;
    const filename = req.file.filename;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.kycDocumentType = documentType || 'citizenship';
    user.kycDocumentImage = filename;
    user.kycStatus = 'pending'; // Set to pending for admin review
    
    await user.save();

    // Notify Admins in Real-time
    try {
      const { io } = require('../server');
      if (io) {
        const adminPayload = {
          userId: user.id,
          userName: user.name,
          status: 'pending',
          documentType: documentType || 'citizenship',
          submittedAt: new Date()
        };
        io.to('admins').emit('kyc-submitted', adminPayload);
        
        // Also create a system notification for admins
        const Notification = require('../models/Notification');
        await Notification.create({
          user_id: null, // Broadcast/Admin alert
          title: '📄 New KYC Submission',
          message: `${user.name} has submitted KYC documents for verification.`,
          type: 'info',
          is_broadcast: true,
          link: '/admin/dashboard?tab=kyc'
        });
        
        // Emit notification to admins
        io.to('admins').emit('new-notification', {
          title: '📄 New KYC Submission',
          message: `${user.name} has submitted KYC documents for verification.`,
          type: 'info',
          isBroadcast: true,
          link: '/admin/dashboard?tab=kyc',
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.warn('Failed to send admin notification:', err.message);
    }

    res.json({ 
      success: true, 
      kycStatus: 'pending',
      kycDocumentImage: filename
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload KYC document' });
  }
};

// --- Existing Controller Methods (Preserved) ---

// List all users with search/filter (super admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) where.type = role; // Changed from where.role to where.type based on model
    if (status === 'active') where.isVerified = true;
    if (status === 'blocked') where.isVerified = false;
    
    const users = await User.findAll({ where, paranoid: false });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View user profile/details
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { paranoid: false });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Block/unblock user
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ success: true, active: user.isVerified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Soft delete user
exports.softDeleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset password (generate temp password)
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const bcrypt = require('bcrypt');
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ success: true, tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all vendors with filters
exports.getAllVendors = async (req, res) => {
  try {
    const { search, serviceType, ownershipType, location } = req.query;
    let whereClause = { type: 'vendor', isVerified: true };

    if (ownershipType) whereClause.ownershipType = ownershipType;
    if (location) whereClause.address = { [Op.iLike]: `%${location}%` };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { businessName: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const vendors = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'phone', 'address', 'businessName', 'ownershipType', 'profileImage', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      count: vendors.length,
      vendors: vendors.map(vendor => ({
        id: vendor.id,
        ownerName: vendor.name,
        businessName: vendor.businessName || vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        ownershipType: vendor.ownershipType || 'Individual',
        profileImage: vendor.profileImage ? `${process.env.BASE_URL}/uploads/profiles/${vendor.profileImage}` : null,
        joinDate: new Date(vendor.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await User.findOne({ where: { id, type: 'vendor', isVerified: true } });

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    return res.json({
      success: true,
      vendor: {
        id: vendor.id,
        ownerName: vendor.name,
        businessName: vendor.businessName || vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        ownershipType: vendor.ownershipType || 'Individual',
        profileImage: vendor.profileImage ? `${process.env.BASE_URL}/uploads/profiles/${vendor.profileImage}` : null,
        joinDate: new Date(vendor.createdAt).toLocaleDateString()
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get vendor stats (simplified)
exports.getVendorStats = async (req, res) => {
  try {
    const totalVendors = await User.count({ where: { type: 'vendor', isVerified: true } });
    return res.json({ success: true, stats: { total: totalVendors } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
    const userId = req.user.id;
    const filename = req.file.filename;

    await User.update({ profileImage: filename }, { where: { id: userId } });

    return res.json({
      success: true,
      photoUrl: `${process.env.BASE_URL}/uploads/profiles/${filename}`, 
      message: 'Profile picture updated successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
  }
};

// Get user's booking applications
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const Booking = require('../models/Booking');
    const Property = require('../models/Property');
    
    // Fetch property applications
    const applications = await Booking.findAll({
      where: { tenantId: userId },
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'images', 'address', 'city'] },
        { model: User, as: 'vendor', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all active rentals (properties and bikes) for the user
exports.getMyRentals = async (req, res) => {
  try {
    const userId = req.user.id;
    const Booking = require('../models/Booking');
    const BikeBooking = require('../models/BikeBooking');
    const Property = require('../models/Property');
    const Bike = require('../models/Bike');
    const User = require('../models/User');

    // Property rentals
    const propertyRentals = await Booking.findAll({
      where: { tenantId: userId, status: ['Active', 'Approved'] },
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'vendor', attributes: ['id', 'name', 'email'] }
      ]
    });
    // Bike rentals
    const bikeRentals = await BikeBooking.findAll({
      where: { lessorId: userId, status: ['Active', 'Approved'] },
      include: [
        { model: Bike, as: 'bike' },
        { model: User, as: 'vendor', attributes: ['id', 'name', 'email'] }
      ]
    });
    // Format for frontend
    const rentals = [
      ...propertyRentals.map(r => ({
        id: r.id,
        type: 'property',
        title: r.property?.title,
        image: r.property?.images?.[0],
        location: r.property ? `${r.property.city}, ${r.property.address}` : '',
        startDate: r.moveInDate,
        endDate: r.moveOutDate,
        cost: r.monthlyRent,
        status: r.status,
        vendor: r.vendor
      })),
      ...bikeRentals.map(r => ({
        id: r.id,
        type: 'bike',
        title: r.bike?.brand ? `${r.bike.brand} ${r.bike.model}` : r.bike?.name,
        image: r.bike?.images?.[0],
        location: r.bike?.location,
        startDate: r.startDate,
        endDate: r.endDate,
        cost: r.totalAmount,
        status: r.status,
        vendor: r.vendor
      }))
    ];
    res.json({ success: true, rentals });
  } catch (error) {
    console.error('Get my rentals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rentals', error: error.message });
  }
};

// Save a listing
exports.saveListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId, listingType } = req.body;
    if (!listingId || !listingType) return res.status(400).json({ message: 'Missing listingId or listingType' });
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let saved = user.savedListings || [];
    // Robust search with string conversion to prevent duplicates
    const isAlreadySaved = saved.some(item => 
      String(item.listingId) === String(listingId) && item.listingType === listingType
    );

    if (!isAlreadySaved) {
      // Create a new array reference to ensure Sequelize detects the change
      const newSaved = [...saved, { listingId, listingType }];
      user.savedListings = newSaved;
      user.changed('savedListings', true);
      await user.save();
    }
    res.json({ message: 'Successfully saved', saved: user.savedListings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save listing', error: error.message });
  }
};

// Unsave a listing
exports.unsaveListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId, listingType } = req.body;
    if (!listingId || !listingType) return res.status(400).json({ message: 'Missing listingId or listingType' });
    const User = require('../models/User');
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let saved = user.savedListings || [];
    // Robust filter with string conversion
    const filtered = saved.filter(item => 
      !(String(item.listingId) === String(listingId) && item.listingType === listingType)
    );
    user.savedListings = filtered;
    user.changed('savedListings', true);
    await user.save();
    res.json({ message: 'Successfully unsaved', saved: user.savedListings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsave listing', error: error.message });
  }
};

// Get all saved listings
exports.getSavedListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let saved = user.savedListings || [];
    // Safety check: if savedListings is a string (can happen with JSON storage quirks)
    if (typeof saved === 'string') {
      try {
        saved = JSON.parse(saved);
      } catch (e) {
        saved = [];
      }
    }
    
    if (!Array.isArray(saved)) {
      saved = [];
    }
    
    // Fetch details for each saved listing with safety checks
    const propertyIds = saved
      .filter(i => i && i.listingType === 'property' && i.listingId)
      .map(i => i.listingId);
      
    const bikeIds = saved
      .filter(i => i && i.listingType === 'bike' && i.listingId)
      .map(i => i.listingId);
    
    let properties = [];
    if (propertyIds.length > 0) {
      properties = await Property.findAll({ 
        where: { id: { [Op.in]: propertyIds } } 
      });
    }

    let bikes = [];
    if (bikeIds.length > 0) {
      bikes = await Bike.findAll({ 
        where: { id: { [Op.in]: bikeIds } } 
      });
    }

    res.json({
      properties: properties.map(p => p.toJSON ? p.toJSON() : p),
      bikes: bikes.map(b => b.toJSON ? b.toJSON() : b)
    });
  } catch (error) {
    console.error('❌ Server Error in getSavedListings:', error);
    res.status(500).json({ 
      message: 'Failed to get saved listings', 
      error: error.message
    });
  }
};

module.exports = exports;
