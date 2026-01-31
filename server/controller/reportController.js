const Report = require('../models/Report');
const User = require('../models/User');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const { Op } = require('sequelize');

// Submit a report (Universal)
exports.submitReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const reporterType = req.user.role || 'user';
    
    // Accept both formats
    const listingType = req.body.listingType || req.body.reportedType;
    const listingId = req.body.listingId || req.body.reportedId;
    const { reason, description } = req.body;

    // Validate input
    if (!listingType || !listingId || !reason) {
      return res.status(400).json({ error: 'Listing type, listing ID, and reason are required' });
    }

    const normalizedType = listingType.toLowerCase() === 'automobile' ? 'bike' : listingType.toLowerCase();

    if (!['property', 'bike'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid listing type. Must be "property" or "bike"' });
    }

    // Check if listing exists and find owner
    let listing;
    let ownerId = null;
    if (normalizedType === 'property') {
      listing = await Property.findByPk(listingId);
      if (listing) ownerId = listing.vendorId;
    } else {
      listing = await Bike.findByPk(listingId);
      if (listing) ownerId = listing.vendorId;
    }

    if (!listing) {
      return res.status(404).json({ error: `${normalizedType} not found` });
    }

    // Check if user has already reported this listing
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        listingType: normalizedType,
        listingId
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this listing' });
    }

    // Create report
    const report = await Report.create({
      reporterId,
      reporterType,
      listingType: normalizedType,
      listingId,
      ownerId,
      reason,
      description: description || null,
      status: 'pending'
    });

    // Emit socket event for real-time count updates
    const io = req.app.get('io');
    if (io) {
      // Refresh count for the reporter (user)
      io.to(`user_${reporterId}`).emit('refresh_counts');
      // Refresh count for the owner (vendor) if they exist
      if (ownerId) io.to(`user_${ownerId}`).emit('refresh_counts');
      // Refresh count for admins
      io.to('admins').emit('refresh_counts');
    }

    return res.status(201).json({
      message: 'Report submitted successfully. We will review it shortly.',
      report
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Aliases for compatibility
exports.createReport = exports.submitReport;

// Get user's submitted reports
exports.getUserReports = async (req, res) => {
  try {
    const reporterId = req.user.id;

    const reports = await Report.findAll({
      where: { reporterId },
      order: [['created_at', 'DESC']]
    });

      const enrichedReports = await Promise.all(reports.map(async (report) => {
        const reportData = report.toJSON();
        if (reportData.listingType === 'property') {
          const property = await Property.findByPk(reportData.listingId, { attributes: ['title'] });
          reportData.entityName = property?.title || 'Unknown Property';
        } else if (reportData.listingType === 'bike') {
          const bike = await Bike.findByPk(reportData.listingId, { attributes: ['name', 'brand', 'model'] });
          reportData.entityName = bike?.name || (bike ? `${bike.brand} ${bike.model}` : 'Unknown Vehicle');
        } else {
          reportData.entityName = 'Unknown Listing';
        }
        return reportData;
      }));

    return res.json(enrichedReports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Get reports for vendor's listings (Owner Dashboard)
exports.getVendorReports = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const reports = await Report.findAll({
      where: { ownerId: vendorId },
      order: [['created_at', 'DESC']]
    });

    // Enrich with entity details
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reportData = report.toJSON();
      
      // Get reported entity name
      if (reportData.listingType === 'property') {
        const property = await Property.findByPk(reportData.listingId, { attributes: ['title'] });
        reportData.entityName = property?.title || 'Unknown Property';
      } else {
        const bike = await Bike.findByPk(reportData.listingId, { attributes: ['name', 'brand', 'model'] });
        reportData.entityName = bike?.name || `${bike?.brand} ${bike?.model}` || 'Unknown Vehicle';
      }

      return reportData;
    }));

    res.json(enrichedReports);
  } catch (error) {
    console.error('Error fetching vendor reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Get all reports (admin/vendor only)
exports.getAllReports = async (req, res) => {
  try {
    const { status, listingType } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (listingType) whereClause.listingType = listingType;

    const reports = await Report.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', ['name', 'fullName'], 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reportData = report.toJSON();
      // Get reported entity name
      if (reportData.listingType === 'property') {
        const property = await Property.findByPk(reportData.listingId, { attributes: ['title'] });
        reportData.entityName = property?.title || 'Unknown Property';
      } else if (reportData.listingType === 'bike') {
        const bike = await Bike.findByPk(reportData.listingId, { 
          attributes: ['name', 'brand', 'model', 'vendorId'], 
          include: [{ model: User, as: 'vendor', attributes: ['id', ['name', 'fullName'], 'email', 'phone'] }] 
        });
        reportData.entityName = bike?.name || (bike ? `${bike.brand} ${bike.model}` : 'Unknown Vehicle');
        reportData.owner = bike?.vendor || null;
      } else {
        reportData.entityName = 'Unknown Listing';
      }

      if (!reportData.owner && reportData.ownerId) {
        const owner = await User.findByPk(reportData.ownerId, { attributes: ['id', ['name', 'fullName'], 'email', 'phone'] });
        reportData.owner = owner;
      }

      return reportData;
    }));

    return res.json(enrichedReports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Update report status (Admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const userRole = req.user.role || req.user.type;

    // Only Admin can take action on reports
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only admins can take action on reports' });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes) updateData.adminNotes = adminNotes;

    await report.update(updateData);

    // Emit socket event for real-time count updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${report.reporterId}`).emit('refresh_counts');
      io.to(`user_${report.ownerId}`).emit('refresh_counts');
      io.to('admins').emit('refresh_counts');
    }

    return res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({ error: 'Failed to update report status' });
  }
};

// Cancel report (Reporter only)
exports.cancelReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if the user is the one who reported it
    if (report.reporterId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this report' });
    }

    // Only allow canceling if it's still pending
    if (report.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending reports can be canceled' });
    }

    await report.destroy();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${report.reporterId}`).emit('refresh_counts');
      if (report.ownerId) io.to(`user_${report.ownerId}`).emit('refresh_counts');
      io.to('admins').emit('refresh_counts');
    }

    return res.json({
      success: true,
      message: 'Report canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling report:', error);
    return res.status(500).json({ error: 'Failed to cancel report' });
  }
};

module.exports = exports;
