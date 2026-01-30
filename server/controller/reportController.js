const Report = require('../models/Report');
const User = require('../models/User');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const { Op } = require('sequelize');

// Submit a report
exports.submitReport = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { listingType, listingId, reason, description } = req.body;

    // Validate input
    if (!listingType || !listingId || !reason) {
      return res.status(400).json({ error: 'Listing type, listing ID, and reason are required' });
    }

    if (!['property', 'bike'].includes(listingType)) {
      return res.status(400).json({ error: 'Invalid listing type. Must be "property" or "bike"' });
    }

    // Check if listing exists
    let listing;
    if (listingType === 'property') {
      listing = await Property.findByPk(listingId);
    } else {
      listing = await Bike.findByPk(listingId);
    }

    if (!listing) {
      return res.status(404).json({ error: `${listingType} not found` });
    }

    // Check if user has already reported this listing
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        listingType,
        listingId
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this listing' });
    }

    // Create report
    const report = await Report.create({
      reporterId,
      listingType,
      listingId,
      reason,
      description: description || null,
      status: 'pending'
    });

    return res.status(201).json({
      message: 'Report submitted successfully. We will review it shortly.',
      report: {
        id: report.id,
        listingType: report.listingType,
        listingId: report.listingId,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Get user's submitted reports
exports.getUserReports = async (req, res) => {
  try {
    const reporterId = req.user.id;

    const reports = await Report.findAll({
      where: { reporterId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'listingType', 'listingId', 'reason', 'description', 'status', 'createdAt', 'updatedAt']
    });

    return res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
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

// Update report status (admin only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await report.update({ status });

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
