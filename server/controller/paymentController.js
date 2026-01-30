const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// Get all payments for a tenant
exports.getTenantPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate } = req.query;
    
    const whereClause = { tenantId: userId };
    
    // Apply filters
    if (status && status !== 'all') {
      whereClause.status = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    if (startDate || endDate) {
      whereClause.dueDate = {};
      if (startDate) whereClause.dueDate[Op.gte] = startDate;
      if (endDate) whereClause.dueDate[Op.lte] = endDate;
    }
    
    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          include: [{ model: Property, as: 'property' }]
        },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['dueDate', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments', message: error.message });
  }
};

// Get all payments for an owner
exports.getOwnerPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate } = req.query;
    
    const whereClause = { ownerId: userId };
    
    // Apply filters
    if (status && status !== 'all') {
      whereClause.status = status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    if (startDate || endDate) {
      whereClause.dueDate = {};
      if (startDate) whereClause.dueDate[Op.gte] = startDate;
      if (endDate) whereClause.dueDate[Op.lte] = endDate;
    }
    
    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          include: [{ model: Property, as: 'property' }]
        },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['dueDate', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments', message: error.message });
  }
};

// Mark payment as paid
exports.markPaymentAsPaid = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentMethod, transactionId, notes } = req.body;
    const userId = req.user.id;
    
    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [{ model: User, as: 'tenant' }, { model: User, as: 'owner' }]
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Only tenant or owner can mark as paid
    if (payment.tenantId !== userId && payment.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    payment.status = 'Paid';
    payment.paidDate = new Date();
    payment.paymentMethod = paymentMethod || 'Not specified';
    payment.transactionId = transactionId || null;
    payment.notes = notes || null;
    await payment.save();
    
    // Notify the other party
    const notifyUserId = userId === payment.tenantId ? payment.ownerId : payment.tenantId;
    const notifyType = userId === payment.tenantId ? 'Payment received' : 'Payment confirmed';
    
    await Notification.create({
      user_id: notifyUserId,
      type: 'payment_update',
      title: notifyType,
      message: `Payment of Rs. ${payment.amount} has been marked as paid for due date ${payment.dueDate}`,
      is_read: false
    });
    
    res.json({ message: 'Payment marked as paid', payment });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

// Get payment statistics for owner
exports.getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalPending = await Payment.sum('amount', {
      where: { ownerId: userId, status: 'Pending' }
    }) || 0;
    
    const totalOverdue = await Payment.sum('amount', {
      where: { ownerId: userId, status: 'Overdue' }
    }) || 0;
    
    const totalCollected = await Payment.sum('amount', {
      where: { 
        ownerId: userId, 
        status: 'Paid',
        paidDate: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }) || 0;
    
    const overdueCount = await Payment.count({
      where: { ownerId: userId, status: 'Overdue' }
    });
    
    res.json({
      totalPending,
      totalOverdue,
      totalCollected,
      overdueCount
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Create manual payment entry (for owner)
exports.createPayment = async (req, res) => {
  try {
    const { bookingId, amount, dueDate, notes } = req.body;
    const userId = req.user.id;
    
    const booking = await Booking.findByPk(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.vendorId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const payment = await Payment.create({
      bookingId,
      tenantId: booking.tenantId,
      ownerId: userId,
      amount,
      dueDate,
      status: 'Pending',
      notes
    });
    
    // Notify tenant
    await Notification.create({
      user_id: booking.tenantId,
      type: 'payment_created',
      title: 'New Payment Due',
      message: `A new payment of Rs. ${amount} is due on ${dueDate}`,
      is_read: false
    });
    
    res.status(201).json({ message: 'Payment created', payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate, limit = 50 } = req.query;
    
    let whereClause = {};
    
    if (type === 'tenant') {
      whereClause.tenantId = userId;
    } else if (type === 'owner') {
      whereClause.ownerId = userId;
    } else {
      whereClause[Op.or] = [
        { tenantId: userId },
        { ownerId: userId }
      ];
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = startDate;
      if (endDate) whereClause.createdAt[Op.lte] = endDate;
    }
    
    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Booking,
          include: [{ model: Property, as: 'property' }]
        },
        { model: User, as: 'tenant', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'owner', attributes: ['id', 'fullName', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      paid: payments.filter(p => p.status === 'Paid').length,
      pending: payments.filter(p => p.status === 'Pending').length,
      overdue: payments.filter(p => p.status === 'Overdue').length
    };
    
    res.json({ payments, stats });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

module.exports = exports;
