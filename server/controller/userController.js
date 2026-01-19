const Vendor = require('../models/Vendor');
const { Op } = require('sequelize');

// Get all vendors with filters
exports.getAllVendors = async (req, res) => {
  try {
    const { 
      serviceType, 
      minPrice, 
      maxPrice, 
      ownershipType, 
      location,
      search 
    } = req.query;

    let whereClause = {
      type: 'vendor',
      isVerified: true
    };

    // Apply filters
    if (serviceType) {
      whereClause.serviceType = serviceType;
    }

    if (ownershipType) {
      whereClause.ownershipType = ownershipType;
    }

    if (location) {
      whereClause.address = {
        [Op.iLike]: `%${location}%`
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { businessName: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const vendors = await Vendor.findAll({
      where: whereClause,
      attributes: [
        'id',
        'fullName',
        'email',
        'phone',
        'address',
        'businessName',
        'ownershipType',
        'profileImage',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      count: vendors.length,
      vendors: vendors.map(vendor => ({
        id: vendor.id,
        ownerName: vendor.fullName,
        businessName: vendor.businessName || vendor.fullName,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        ownershipType: vendor.ownershipType || 'Individual',
        profileImage: vendor.profileImage,
        joinDate: new Date(vendor.createdAt).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      }))
    });
  } catch (err) {
    console.error('getAllVendors error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findOne({
      where: {
        id,
        type: 'vendor',
        isVerified: true
      },
      attributes: [
        'id',
        'fullName',
        'email',
        'phone',
        'address',
        'businessName',
        'ownershipType',
        'profileImage',
        'createdAt'
      ]
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    return res.json({
      success: true,
      vendor: {
        id: vendor.id,
        ownerName: vendor.fullName,
        businessName: vendor.businessName || vendor.fullName,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        ownershipType: vendor.ownershipType || 'Individual',
        profileImage: vendor.profileImage,
        joinDate: new Date(vendor.createdAt).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      }
    });
  } catch (err) {
    console.error('getVendorById error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Get vendor statistics
exports.getVendorStats = async (req, res) => {
  try {
    const totalVendors = await Vendor.count({
      where: {
        type: 'vendor',
        isVerified: true
      }
    });

    const vendorsByOwnership = await Vendor.findAll({
      where: {
        type: 'vendor',
        isVerified: true
      },
      attributes: [
        'ownershipType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['ownershipType']
    });

    return res.json({
      success: true,
      stats: {
        total: totalVendors,
        byOwnership: vendorsByOwnership
      }
    });
  } catch (err) {
    console.error('getVendorStats error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }

    const userId = req.user.id;
    const filename = req.file.filename;

    // Update user's profile picture in database
    await Vendor.update(
      { profileImage: filename },
      { where: { id: userId } }
    );

    return res.json({
      success: true,
      profilePicture: filename,
      message: 'Profile picture updated successfully'
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
  }
};

// Get user's booking applications
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 Fetching applications for user:', userId);
    
    const Booking = require('../models/Booking');
    const Property = require('../models/Property');
    const User = require('../models/User');

    // Fetch all bookings where the user is the tenant
    const applications = await Booking.findAll({
      where: { tenantId: userId },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'propertyType', 'images', 'rentPrice', 'bedrooms', 'bathrooms']
        },
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${applications.length} applications for user ${userId}`);
    
    const formattedApplications = applications.map(app => ({
      id: app.id,
      property: app.property,
      vendor: app.vendor,
      moveInDate: app.moveInDate,
      moveOutDate: app.moveOutDate,
      monthlyRent: app.monthlyRent,
      status: app.status,
      message: app.message,
      createdAt: app.createdAt
    }));

    console.log('📤 Sending applications:', JSON.stringify(formattedApplications, null, 2));

    return res.json({
      success: true,
      applications: formattedApplications
    });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch applications', details: error.message });
  }
};

module.exports = exports;
