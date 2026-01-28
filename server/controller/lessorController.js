const User = require('../models/User');
const { Op } = require('sequelize');

// Get all lessors with filters
exports.getAllVendors = async (req, res) => {
  try {
    const { 
      location,
      search 
    } = req.query;

    let whereClause = {
      type: 'lessor',
      isVerified: true
    };

    // Apply filters
    if (location) {
      whereClause.address = {
        [Op.iLike]: `%${location}%`
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const lessors = await User.findAll({
      where: whereClause,
      attributes: [
        'id',
        'fullName',
        'email',
        'phone',
        'address',
        'profileImage',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      count: lessors.length,
      lessors: lessors.map(lessor => ({
        id: lessor.id,
        name: lessor.fullName,
        email: lessor.email,
        phone: lessor.phone,
        address: lessor.address,
        profileImage: lessor.profileImage,
        joinDate: new Date(lessor.createdAt).toLocaleDateString('en-US', { 
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

// Get lessor by ID
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const lessor = await User.findOne({
      where: {
        id,
        type: 'lessor',
        isVerified: true
      },
      attributes: [
        'id',
        'fullName',
        'email',
        'phone',
        'address',
        'profileImage',
        'createdAt'
      ]
    });

    if (!lessor) {
      return res.status(404).json({ error: 'Lessor not found' });
    }

    return res.json({
      success: true,
      lessor: {
        id: lessor.id,
        name: lessor.fullName,
        email: lessor.email,
        phone: lessor.phone,
        address: lessor.address,
        profileImage: lessor.profileImage,
        joinDate: new Date(lessor.createdAt).toLocaleDateString('en-US', { 
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

// Get lessor statistics
exports.getVendorStats = async (req, res) => {
  try {
    const { userId } = req.query;

    const whereClause = {
      type: 'lessor',
      isVerified: true
    };

    if (userId) {
      whereClause.id = userId;
    }

    const lessors = await User.findAll({
      where: whereClause,
      attributes: ['id', 'fullName']
    });

    return res.json({
      success: true,
      totalLessors: lessors.length,
      stats: lessors
    });
  } catch (err) {
    console.error('getVendorStats error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { id } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const lessor = await User.findOne({
      where: { id, type: 'lessor' }
    });

    if (!lessor) {
      return res.status(404).json({ error: 'Lessor not found' });
    }

    await lessor.update({
      profileImage: req.file.filename
    });

    return res.json({
      success: true,
      message: 'Profile picture updated',
      profileImage: req.file.filename
    });
  } catch (err) {
    console.error('uploadProfilePicture error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
