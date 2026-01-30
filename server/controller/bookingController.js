const BookingApplication = require('../models/BookingApplication');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const User = require('../models/User');
const { Op } = require('sequelize');

// Submit a booking application
exports.applyForBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId, listingType, startDate, endDate, duration, totalAmount } = req.body;

    if (!listingId || !listingType || !startDate || !endDate || !duration || !totalAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Verify listing exists
    const Model = listingType === 'property' ? Property : Bike;
    const listing = await Model.findByPk(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'Available') {
      return res.status(400).json({ message: 'Listing is not available' });
    }

    // Check for overlapping applications
    const overlapping = await BookingApplication.findOne({
      where: {
        listingId,
        listingType,
        status: { [Op.in]: ['pending', 'approved', 'paid'] },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] }
          },
          {
            endDate: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(400).json({ message: 'This listing already has a booking for the selected dates' });
    }

    // Create application
    const application = await BookingApplication.create({
      userId,
      listingId,
      listingType,
      startDate,
      endDate,
      duration,
      totalAmount
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply booking error:', error);
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
};

// Get user's applications
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await BookingApplication.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    // Enrich with listing data
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const Model = app.listingType === 'property' ? Property : Bike;
        const listing = await Model.findByPk(app.listingId, {
          include: [{ model: User, as: 'vendor', attributes: ['id', 'name', 'email'] }]
        });

        return {
          applicationId: app.id, // Explicit ID for frontend
          id: app.id, // Keeping this for backward compatibility if needed, though it might be overwritten
          status: app.status,
          startDate: app.startDate,
          endDate: app.endDate,
          duration: app.duration,
          grandTotal: app.totalAmount,
          totalAmount: app.totalAmount,
          rejectionReason: app.rejectionReason,
          createdAt: app.createdAt,
          type: app.listingType,
          ...listing?.toJSON(), // This spreads property ID over app ID
          bookingId: app.id // Another alias just in case
        };
      })
    );

    res.json(enrichedApplications.filter(app => app.id));
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

// Update application details (User)
exports.updateApplicationDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Application ID
    const { startDate, endDate, duration, totalAmount } = req.body;

    const application = await BookingApplication.findOne({
      where: { id, userId }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Can only edit pending applications' });
    }

    // Check availability for new dates (excluding this application)
    const overlapping = await BookingApplication.findOne({
      where: {
        listingId: application.listingId,
        listingType: application.listingType,
        status: { [Op.in]: ['pending', 'approved', 'paid'] },
        id: { [Op.ne]: id }, // Exclude current application
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          { [Op.and]: [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }] }
        ]
      }
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Dates are not available' });
    }

    application.startDate = startDate;
    application.endDate = endDate;
    application.duration = duration;
    application.totalAmount = totalAmount;
    await application.save();

    res.json({ message: 'Application updated successfully', application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Failed to update application', error: error.message });
  }
};

// Cancel application (only if pending)
exports.cancelApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await BookingApplication.findOne({
      where: { id, userId }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending applications' });
    }

    application.status = 'cancelled';
    await application.save();

    res.json({ message: 'Application cancelled successfully' });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({ message: 'Failed to cancel application', error: error.message });
  }
};

// Owner: Get applications for their listings
exports.getOwnerApplications = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get all properties and bikes owned by this vendor
    const properties = await Property.findAll({ where: { vendorId }, attributes: ['id'] });
    const bikes = await Bike.findAll({ where: { vendorId }, attributes: ['id'] });

    const propertyIds = properties.map(p => p.id);
    const bikeIds = bikes.map(b => b.id);

    // Get all applications for these listings
    const applications = await BookingApplication.findAll({
      where: {
        [Op.or]: [
          { listingId: { [Op.in]: propertyIds }, listingType: 'property' },
          { listingId: { [Op.in]: bikeIds }, listingType: 'bike' }
        ]
      },
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'phoneNumber'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Enrich with listing data
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const Model = app.listingType === 'property' ? Property : Bike;
        const listing = await Model.findByPk(app.listingId);

        return {
          id: app.id,
          status: app.status,
          startDate: app.startDate,
          endDate: app.endDate,
          duration: app.duration,
          totalAmount: app.totalAmount,
          rejectionReason: app.rejectionReason,
          createdAt: app.createdAt,
          type: app.listingType,
          applicant: app.applicant,
          listing: listing?.toJSON()
        };
      })
    );

    res.json(enrichedApplications);
  } catch (error) {
    console.error('Get owner applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
  }
};

// Owner: Approve or reject application
exports.updateApplicationStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await BookingApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify ownership
    const Model = application.listingType === 'property' ? Property : Bike;
    const listing = await Model.findByPk(application.listingId);
    
    if (!listing || listing.vendorId !== vendorId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Can only update pending applications' });
    }

    application.status = status;
    if (status === 'rejected' && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    res.json({ message: `Application ${status}`, application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Failed to update application', error: error.message });
  }
};

// Mark application as paid and create rental
exports.payForApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const application = await BookingApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (application.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved applications can be paid' });
    }

    // Mark as paid
    application.status = 'paid';
    await application.save();

    let rental;
    if (application.listingType === 'property') {
      const property = await Property.findByPk(application.listingId);
      if (!property) return res.status(404).json({ message: 'Property not found' });
      rental = await require('../models/Booking').create({
        propertyId: property.id,
        tenantId: userId,
        vendorId: property.vendorId,
        moveInDate: application.startDate,
        moveOutDate: application.endDate,
        monthlyRent: application.totalAmount,
        status: 'Active',
        message: 'Created from paid application'
      });
    } else if (application.listingType === 'bike') {
      const bike = await Bike.findByPk(application.listingId);
      if (!bike) return res.status(404).json({ message: 'Bike not found' });
      rental = await require('../models/BikeBooking').create({
        lessorId: userId,
        vendorId: bike.vendorId,
        bikeId: bike.id,
        startDate: application.startDate,
        endDate: application.endDate,
        totalDays: application.duration,
        dailyRate: Number(application.totalAmount) / application.duration,
        totalAmount: application.totalAmount,
        status: 'Active',
        message: 'Created from paid application'
      });
    }
    res.json({ message: 'Payment successful, rental created', rental });
  } catch (error) {
    console.error('Pay for application error:', error);
    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
};

module.exports = exports;

