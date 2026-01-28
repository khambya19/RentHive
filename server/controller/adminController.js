const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');

// Get admin dashboard stats
exports.getAdminStats = async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.count();

    // Total properties count
    const totalProperties = await Property.count();

    // Total bookings count
    const totalBookings = await Booking.count();

    // Total revenue (sum of all payments)
    const revenueResult = await Payment.sum('amount');
    const totalRevenue = revenueResult || 0;

    // Additional stats
    const activeUsers = await User.count({ where: { isVerified: true } });
    const pendingBookings = await Booking.count({ where: { status: 'Pending' } }); // Capitalized 'Pending'

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue,
        activeUsers,
        pendingBookings
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all users (super admin)
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
    
    if (role && role !== 'all') {
      where.type = role;
    }
    
    if (status === 'active') {
      where.isVerified = true;
    } else if (status === 'blocked') {
      where.isVerified = false;
    }
    
    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'type', 'isVerified', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.type,
        active: user.isVerified,
        kyc_status: 'pending',
        bookings_count: 0,
        created_at: user.createdAt
      }))
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.type,
        active: user.isVerified,
        kyc_status: 'pending',
        bookings_count: 0,
        created_at: user.createdAt
      }
    });
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

// Reset password
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const crypto = require('crypto');
    const tempPassword = crypto.randomBytes(4).toString('hex');
    
    // TODO: Hash password before saving in production
    user.password = tempPassword;
    await user.save();
    
    // TODO: Send temp password via email
    res.json({ success: true, tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = exports;
