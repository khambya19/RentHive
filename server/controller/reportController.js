const Report = require('../models/Report');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// Create a new report
const createReport = async (req, res) => {
  try {
    const { reportedType, reportedId, reason, description } = req.body;
    const reporterType = req.user.role; // 'user' or 'vendor'
    const reporterId = req.user.id;

    if (!reportedType || !reportedId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the owner of the reported entity
    let ownerId = null;
    if (reportedType === 'property') {
      const property = await Property.findByPk(reportedId);
      if (property) ownerId = property.vendorId;
    } else if (reportedType === 'automobile') {
      const bike = await Bike.findByPk(reportedId);
      if (bike) ownerId = bike.vendorId;
    }

    const report = await Report.create({
      reporterType,
      reporterId,
      reportedType,
      reportedId,
      ownerId,
      reason,
      description,
      status: 'pending'
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

// Get reports for vendor's listings (Owner Dashboard)
const getVendorReports = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const reports = await Report.findAll({
      where: { ownerId: vendorId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'reporterType', 'reportedType', 'reportedId', 'reason', 'description', 'status', 'createdAt']
    });

    // Enrich with entity details
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const reportData = report.toJSON();
      
      // Get reported entity name
      if (reportData.reportedType === 'property') {
        const property = await Property.findByPk(reportData.reportedId, { attributes: ['title'] });
        reportData.entityName = property?.title || 'Unknown Property';
      } else if (reportData.reportedType === 'automobile') {
        const bike = await Bike.findByPk(reportData.reportedId, { attributes: ['name', 'brand', 'model'] });
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

// Update report status (for owner to mark as reviewed/resolved)
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const vendorId = req.user.id;

    const report = await Report.findOne({
      where: { id, ownerId: vendorId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found or unauthorized' });
    }

    await report.update({ status, adminNotes });

    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

module.exports = {
  createReport,
  getVendorReports,
  updateReportStatus
};
