const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const Report = require('../models/Report');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');

// Get admin dashboard stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProperties = await Property.count();
    const totalBookings = await Booking.count();
    const revenueResult = await Payment.sum('amount');
    const totalRevenue = revenueResult || 0;
    const activeUsers = await User.count({ where: { isVerified: true } });
    const pendingBookings = await Booking.count({ where: { status: 'Pending' } });
    
    // KYC Stats
    const pendingKyc = await User.count({ where: { kycStatus: 'pending' } });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue,
        activeUsers,
        pendingBookings,
        pendingKyc
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all users (super admin) with better KYC info
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, kycStatus } = req.query;
    let where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (role && role !== 'all') {
      if (role.includes(',')) {
        where.type = { [Op.in]: role.split(',') };
      } else {
        where.type = role;
      }
    } else {
      // Exclude admins from general lists
      where.type = { [Op.notIn]: ['admin', 'super_admin'] };
    }
    
    if (status === 'active') where.isVerified = true;
    else if (status === 'blocked') where.isVerified = false;

    if (kycStatus) where.kycStatus = kycStatus;
    
    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'type', 'isVerified', 'kycStatus', 'kycDocumentType', 'kycDocumentImage', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:5050';

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.type,
        active: user.isVerified,
        kyc_status: user.kycStatus,
        kyc_document_type: user.kycDocumentType,
        kyc_doc: user.kycDocumentImage ? `${baseUrl}/uploads/profiles/${user.kycDocumentImage}` : null,
        created_at: user.createdAt
      }))
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update KYC Status
exports.updateKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // 'approved', 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
       return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.kycStatus = status;
    if (status === 'approved') {
      user.isVerified = true; // Auto-verify account when KYC approves
    } else if (status === 'rejected') {
        user.isVerified = false;
        // Ideally save 'remarks' to a notification or audit log
        console.log(`KYC Rejected for user ${id}. Remarks: ${remarks}`);
    }

    await user.save();

    // Notify User in Real-time
    try {
      const io = req.app.get('io');
      if (io) {
        const title = status === 'approved' ? '✅ KYC Approved!' : '❌ KYC Rejected';
        const message = status === 'approved'
          ? 'Congratulations! Your identity has been verified. You can now post listings.'
          : `Your KYC verification was rejected. ${remarks || 'Please ensure your documents are clear and valid.'}`;
        
        // Create DB notification
        const Notification = require('../models/Notification');
        const notification = await Notification.create({
          user_id: user.id,
          title,
          message,
          type: status === 'approved' ? 'success' : 'error',
          is_broadcast: false,
          link: '/owner/dashboard?tab=settings'
        });

        // Emit to user room
        const payload = {
          id: notification.id,
          title,
          message,
          type: notification.type,
          link: notification.link,
          isRead: false,
          createdAt: notification.createdAt
        };
        io.to(`user_${user.id}`).emit('new-notification', payload);
        
        // Explicit KYC update event for frontend listeners
        io.to(`user_${user.id}`).emit('kyc-status-updated', { 
           status, 
           isVerified: user.isVerified 
        });
      }
    } catch (err) {
      console.warn('Failed to send user notification:', err.message);
    }

    res.json({ success: true, message: `KYC ${status} successfully`, kycStatus: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Use a simpler approach for base URL
    const baseUrl = process.env.SERVER_BASE_URL || 'http://localhost:5050';
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.type,
        active: user.isVerified,
        kyc_status: user.kycStatus,
        kyc_document_type: user.kycDocumentType,
        kyc_doc: user.kycDocumentImage ? `${baseUrl}/uploads/profiles/${user.kycDocumentImage}` : null,
        created_at: user.createdAt
      }
    });
  } catch (err) {
    console.error(`Error in getUserById for ID ${req.params.id}:`, err);
    res.status(500).json({ error: 'Internal server error fetching user details' });
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

// Delete user with all related records
exports.softDeleteUser = async (req, res) => {
  const sequelize = require('../config/db');
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related records in order (respecting foreign key constraints)
    const Message = require('../models/Message');
    const Notification = require('../models/Notification');
    const Review = require('../models/Review');
    const Payment = require('../models/Payment');
    const Booking = require('../models/Booking');
    const BikeBooking = require('../models/BikeBooking');
    const BookingApplication = require('../models/BookingApplication');
    const Property = require('../models/Property');
    const Bike = require('../models/Bike');
    const Report = require('../models/Report');

    // Delete messages (both sent and received)
    await Message.destroy({ where: { senderId: userId }, transaction });
    await Message.destroy({ where: { receiverId: userId }, transaction });

    // Delete notifications
    await Notification.destroy({ where: { user_id: userId }, transaction });

    // Delete reviews
    await Review.destroy({ where: { userId: userId }, transaction });

    // Delete reports (both created and about user's listings)
    await Report.destroy({ where: { reporterId: userId }, transaction });

    // Delete payments
    await Payment.destroy({ where: { tenantId: userId }, transaction });
    await Payment.destroy({ where: { ownerId: userId }, transaction });

    // Delete booking applications
    await BookingApplication.destroy({ where: { userId: userId }, transaction });

    // Delete bookings (as tenant or vendor)
    await Booking.destroy({ where: { tenantId: userId }, transaction });
    await Booking.destroy({ where: { vendorId: userId }, transaction });

    // Delete bike bookings
    await BikeBooking.destroy({ where: { lessorId: userId }, transaction });
    await BikeBooking.destroy({ where: { vendorId: userId }, transaction });

    // Delete properties owned by user
    await Property.destroy({ where: { vendorId: userId }, transaction });

    // Delete bikes owned by user
    await Bike.destroy({ where: { vendorId: userId }, transaction });

    // Finally delete the user
    await user.destroy({ transaction });

    await transaction.commit();
    res.json({ success: true, message: 'User and all related records deleted successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user', message: err.message });
  }
};

// --- Properties Management ---
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      include: [{ model: User, as: 'vendor', attributes: ['id', ['name', 'fullName'], 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.togglePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    
    // Toggle approval (or set via body if needed, but simple toggle is often enough for 'verify')
    // If we want detailed override, we can check body.
    if (req.body.isApproved !== undefined) {
      property.isApproved = req.body.isApproved;
    } else {
        // Default toggle
        property.isApproved = !property.isApproved;
    }
    
    await property.save();
    res.json({ success: true, property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    await property.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Automobiles Management ---
exports.getAllBikes = async (req, res) => {
  try {
    const bikes = await Bike.findAll({
      include: [{ model: User, as: 'vendor', attributes: ['id', ['name', 'fullName'], 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, bikes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleBikeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findByPk(id);
    if (!bike) return res.status(404).json({ error: 'Vehicle not found' });
    
    if (req.body.isApproved !== undefined) {
        bike.isApproved = req.body.isApproved;
    } else {
        bike.isApproved = !bike.isApproved;
    }
    
    await bike.save();
    res.json({ success: true, bike });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBike = async (req, res) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findByPk(id);
    if (!bike) return res.status(404).json({ error: 'Vehicle not found' });
    await bike.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Reports Management ---
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [{ model: User, as: 'reporter', attributes: ['id', ['name', 'fullName'], 'email', 'type'] }],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    
    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
