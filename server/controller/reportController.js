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
      order: [['createdAt', 'DESC']]
    });

    return res.json(reports);
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
      order: [['createdAt', 'DESC']]
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
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(reports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Permission check: admin can update any, vendor can only update reports on their listings
    if (userRole !== 'admin' && report.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this report' });
    }

    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;

    await report.update(updateData);

    return res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({ error: 'Failed to update report status' });
  }
};

module.exports = exports;
