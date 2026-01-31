const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const BikeBooking = require('../models/BikeBooking');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Bike = require('../models/Bike');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');

// All routes require authentication
router.use(protect);

// Get owner dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const ownerId = req.user.id;
    console.log('📊 Fetching owner stats for user ID:', ownerId);

    // Get properties owned by this owner
    const totalProperties = await Property.count({ 
      where: { vendorId: ownerId } 
    });
    console.log('🏠 Total properties:', totalProperties);
    
    const availableProperties = await Property.count({ 
      where: { vendorId: ownerId, status: 'Available' } 
    });
    console.log('✅ Available properties:', availableProperties);

    // Get bikes owned by this owner
    const totalBikes = await Bike.count({ 
      where: { vendorId: ownerId } 
    });
    console.log('🚲 Total bikes:', totalBikes);
    
    const availableBikes = await Bike.count({ 
      where: { vendorId: ownerId, status: 'Available' } 
    });
    console.log('✅ Available bikes:', availableBikes);

    // Calculate total listings (properties + bikes)
    const totalListings = totalProperties + totalBikes;
    const availableListings = availableProperties + availableBikes;
    console.log('📋 Total listings (properties + bikes):', totalListings);
    console.log('✅ Total available:', availableListings);

    // Get property bookings (where lessor is the property owner)
    const totalBookings = await Booking.count({ 
      where: { vendorId: ownerId } 
    });
    console.log('📅 Total property bookings:', totalBookings);

    // Get bike rentals (where owner is the bike vendor)
    const bikeRentals = await BikeBooking.count({ 
      where: { vendorId: ownerId } 
    });
    console.log('🏍️ Total bike rentals:', bikeRentals);

    // Calculate monthly revenue from Paid payments (actual cash flow)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Payment.sum('amount', {
      where: {
        ownerId: ownerId,
        status: 'Paid',
        created_at: { [Op.gte]: startOfMonth }
      }
    }) || 0;
    
    console.log('💰 Monthly revenue (Paid payments):', monthlyRevenue);

    return res.json({
      totalProperties: totalListings,  // Now includes bikes
      availableProperties: availableListings,  // Now includes available bikes
      totalBookings,
      monthlyRevenue: parseFloat(monthlyRevenue),
      bikeRentals,
      // Additional detailed stats
      breakdown: {
        properties: totalProperties,
        bikes: totalBikes,
        availableProperties,
        availableBikes
      }
    });
  } catch (error) {
    console.error('❌ Error fetching owner stats:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Get owner's bike bookings
router.get('/bike-bookings', async (req, res) => {
  try {
    const ownerId = req.user.id;

    const bookings = await BikeBooking.findAll({
      where: { vendorId: ownerId },
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'fullName', 'businessName', 'phone']
        },
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'brand', 'model', 'type', 'images', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(bookings);
  } catch (error) {
    console.error('Error fetching lessor bike bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bike bookings' });
  }
});

// Get all bookings for owner (property bookings + bike rentals from their bikes)
router.get('/bookings', async (req, res) => {
  try {
    const ownerId = req.user.id;
    console.log(' Fetching all bookings for owner ID:', ownerId);

    // Get property bookings where owner is the property owner
    const propertyBookings = await Booking.findAll({
      where: { vendorId: ownerId },
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'propertyType', 'images']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log(` Found ${propertyBookings.length} property bookings`);

    // Transform property bookings to match frontend expectations
    const transformedPropertyBookings = propertyBookings.map(booking => ({
      id: booking.id,
      startDate: booking.moveInDate,
      endDate: booking.moveOutDate,
      totalAmount: booking.monthlyRent,
      status: booking.status,
      message: booking.message,
      createdAt: booking.createdAt,
      renter: booking.tenant ? {
        fullName: booking.tenant.name,
        phone: booking.tenant.phone,
        email: booking.tenant.email
      } : null,
      property: booking.property ? {
        title: booking.property.title,
        location: `${booking.property.address}, ${booking.property.city}`,
        propertyType: booking.property.propertyType,
        images: booking.property.images
      } : null
    }));

    // Get bike bookings where this owner is the bike vendor (the one who posted the bike)
    const bikeBookings = await BikeBooking.findAll({
      where: { vendorId: ownerId },
      include: [
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'brand', 'model', 'type', 'images', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log(` Found ${bikeBookings.length} bike bookings`);

    return res.json({
      propertyBookings: transformedPropertyBookings,
      bikeBookings
    });
  } catch (error) {
    console.error('❌ Error fetching all owner bookings:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ error: 'Failed to fetch all bookings', details: error.message });
  }
});

// Alias route for backward compatibility
router.get('/all-bookings', async (req, res) => {
  try {
    const ownerId = req.user.id;
    console.log('📋 Fetching all bookings for owner ID:', ownerId);

    const BookingApplication = require('../models/BookingApplication');

    // Get property bookings where owner is the property owner (OLD SYSTEM)
    const propertyBookings = await Booking.findAll({
      where: { vendorId: ownerId },
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'propertyType', 'images']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log(`✅ Found ${propertyBookings.length} property bookings (old system)`);

    // Get all properties and bikes owned by this vendor
    const ownedProperties = await Property.findAll({ where: { vendorId: ownerId }, attributes: ['id'] });
    const ownedBikes = await Bike.findAll({ where: { vendorId: ownerId }, attributes: ['id'] });

    const propertyIds = ownedProperties.map(p => p.id);
    const bikeIds = ownedBikes.map(b => b.id);

    // Get booking applications for owned properties and bikes (NEW SYSTEM)
    const applications = await BookingApplication.findAll({
      where: {
        [Op.or]: [
          { listingId: { [Op.in]: propertyIds }, listingType: 'property' },
          { listingId: { [Op.in]: bikeIds }, listingType: 'bike' }
        ]
      },
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log(`✅ Found ${applications.length} booking applications (new system)`);

    // Enrich applications with listing data and convert to booking format
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const Model = app.listingType === 'property' ? Property : Bike;
        const listing = await Model.findByPk(app.listingId);

        if (app.listingType === 'property') {
          return {
            id: app.id,
            applicationId: app.id,
            startDate: app.startDate,
            endDate: app.endDate,
            duration: app.duration || (Math.ceil(Math.abs(new Date(app.endDate) - new Date(app.startDate)) / (1000 * 60 * 60 * 24)) + 1),
            totalAmount: app.totalAmount,
            status: app.status === 'pending' ? 'Pending' : app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Pending',
            message: `Application for ${app.duration || (Math.ceil(Math.abs(new Date(app.endDate) - new Date(app.startDate)) / (1000 * 60 * 60 * 24)) + 1)} days`,
            createdAt: app.createdAt,
            isApplication: true,
            renter: app.applicant ? {
              fullName: app.applicant.name,
              phone: app.applicant.phone,
              email: app.applicant.email
            } : null,
            property: listing ? {
              id: listing.id,
              title: listing.title,
              location: `${listing.address}, ${listing.city}`,
              propertyType: listing.propertyType,
              images: listing.images
            } : null
          };
        } else {
          return {
            id: app.id,
            applicationId: app.id,
            startDate: app.startDate,
            endDate: app.endDate,
            duration: app.duration || (Math.ceil(Math.abs(new Date(app.endDate) - new Date(app.startDate)) / (1000 * 60 * 60 * 24)) + 1),
            totalDays: app.duration || (Math.ceil(Math.abs(new Date(app.endDate) - new Date(app.startDate)) / (1000 * 60 * 60 * 24)) + 1),
            totalAmount: app.totalAmount,
            status: app.status === 'pending' ? 'Pending' : app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Pending',
            message: `Application for ${app.duration || (Math.ceil(Math.abs(new Date(app.endDate) - new Date(app.startDate)) / (1000 * 60 * 60 * 24)) + 1)} days`,
            createdAt: app.createdAt,
            isApplication: true,
            lessor: app.applicant ? {
              id: app.applicant.id,
              name: app.applicant.name,
              fullName: app.applicant.name,
              phone: app.applicant.phone,
              email: app.applicant.email
            } : null,
            bike: listing ? {
              id: listing.id,
              brand: listing.brand,
              model: listing.model,
              type: listing.type,
              images: listing.images,
              location: listing.location
            } : null
          };
        }
      })
    );

    // Transform property bookings to match frontend expectations
    const transformedPropertyBookings = propertyBookings.map(booking => ({
      id: booking.id,
      startDate: booking.moveInDate,
      endDate: booking.moveOutDate,
      totalAmount: booking.monthlyRent,
      duration: (Math.ceil(Math.abs(new Date(booking.moveOutDate) - new Date(booking.moveInDate)) / (1000 * 60 * 60 * 24)) + 1),
      status: booking.status,
      message: booking.message,
      createdAt: booking.createdAt,
      isApplication: false,
      renter: booking.tenant ? {
        id: booking.tenant.id,
        name: booking.tenant.name,
        fullName: booking.tenant.name,
        phone: booking.tenant.phone,
        email: booking.tenant.email
      } : null,
      property: booking.property ? {
        id: booking.property.id,
        title: booking.property.title,
        location: `${booking.property.address}, ${booking.property.city}`,
        propertyType: booking.property.propertyType,
        images: booking.property.images
      } : null
    }));

    // Get bike bookings where this owner is the bike vendor (OLD SYSTEM)
    const bikeBookings = await BikeBooking.findAll({
      where: { vendorId: ownerId },
      include: [
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'brand', 'model', 'type', 'images', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform bike bookings to match frontend expectations
    const transformedBikeBookings = bikeBookings.map(booking => ({
      ...booking.toJSON(),
      duration: booking.totalDays,
      lessor: booking.lessor ? {
        id: booking.lessor.id,
        name: booking.lessor.name,
        fullName: booking.lessor.name,
        phone: booking.lessor.phone,
        email: booking.lessor.email
      } : null
    }));
    console.log(`✅ Found ${bikeBookings.length} bike bookings (old system)`);

    // Separate property and bike applications
    const propertyApplications = enrichedApplications.filter(app => app.property);
    const bikeApplications = enrichedApplications.filter(app => app.bike);

    // Merge old bookings with new applications
    const allPropertyBookings = [...transformedPropertyBookings, ...propertyApplications];
    const allBikeBookings = [...transformedBikeBookings, ...bikeApplications];

    console.log(`📊 Total: ${allPropertyBookings.length} property bookings, ${allBikeBookings.length} bike bookings`);

    return res.json({
      propertyBookings: allPropertyBookings,
      bikeBookings: allBikeBookings
    });
  } catch (error) {
    console.error('❌ Error fetching all owner bookings:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ error: 'Failed to fetch all bookings', details: error.message });
  }
});

// Approve property booking or application
router.patch('/bookings/:bookingId/approve', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.id;
    const BookingApplication = require('../models/BookingApplication');
    const Notification = require('../models/Notification');
    const io = req.app.get('io');

    // Try to find in old Booking system first
    let booking = await Booking.findOne({
      where: { id: bookingId, vendorId: ownerId },
      include: [{ model: User, as: 'tenant' }]
    });

    if (booking) {
      // OLD SYSTEM - Booking
      booking.status = 'Active';
      await booking.save();
      
      // Send notification to the applicant
      if (booking.tenant) {
        const notification = await Notification.create({
          userId: booking.tenant.id,
          type: 'booking',
          title: 'Application Approved! 🎉',
          message: 'Your rental application has been approved! The property is now yours.',
          isRead: false
        });

        if (io) {
          io.to(`user_${booking.tenant.id}`).emit('new-notification', notification);
        }
      }
      
      console.log(`✅ Booking ${bookingId} approved and set to Active (old system)`);
      return res.json({ message: 'Booking approved successfully', booking });
    }

    // Try to find in new BookingApplication system
    const application = await BookingApplication.findByPk(bookingId, {
      include: [{ model: User, as: 'applicant' }]
    });
    
    if (application) {
      // Verify ownership
      const Model = application.listingType === 'property' ? Property : Bike;
      const listing = await Model.findByPk(application.listingId);
      
      if (!listing || listing.vendorId !== ownerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // NEW SYSTEM - BookingApplication
      application.status = 'approved';
      await application.save();
      
      // Send notification to the specific applicant
      if (application.applicant) {
        const listingTitle = listing.title || listing.brand || 'the listing';
        const notification = await Notification.create({
          userId: application.applicant.id,
          type: 'booking',
          title: 'Application Approved! 🎉',
          message: `Great news! Your application for "${listingTitle}" has been approved!`,
          isRead: false,
          metadata: {
            listingId: listing.id,
            listingType: application.listingType,
            applicationId: bookingId
          }
        });

        if (io) {
          io.to(`user_${application.applicant.id}`).emit('new-notification', notification);
        }
      }
      
      console.log(`✅ Application ${bookingId} approved (new system)`);
      return res.json({ message: 'Application approved successfully', booking: application });
    }

    return res.status(404).json({ error: 'Booking/Application not found' });
  } catch (error) {
    console.error('❌ Error approving booking:', error);
    return res.status(500).json({ error: 'Failed to approve booking', details: error.message });
  }
});

// Reject property booking or application
router.patch('/bookings/:bookingId/reject', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.id;
    const BookingApplication = require('../models/BookingApplication');
    const Notification = require('../models/Notification');
    const io = req.app.get('io');

    // Try to find in old Booking system first
    let booking = await Booking.findOne({
      where: { id: bookingId, vendorId: ownerId },
      include: [{ model: User, as: 'tenant' }]
    });

    if (booking) {
      // OLD SYSTEM - Booking
      booking.status = 'Rejected';
      await booking.save();
      
      // Send notification to the applicant
      if (booking.tenant) {
        const notification = await Notification.create({
          userId: booking.tenant.id,
          type: 'booking',
          title: 'Application Status Update',
          message: 'Unfortunately, your rental application was not approved this time.',
          isRead: false
        });

        if (io) {
          io.to(`user_${booking.tenant.id}`).emit('new-notification', notification);
        }
      }
      
      console.log(`✅ Booking ${bookingId} rejected (old system)`);
      return res.json({ message: 'Booking rejected successfully', booking });
    }

    // Try to find in new BookingApplication system
    const application = await BookingApplication.findByPk(bookingId, {
      include: [{ model: User, as: 'applicant' }]
    });
    
    if (application) {
      // Verify ownership
      const Model = application.listingType === 'property' ? Property : Bike;
      const listing = await Model.findByPk(application.listingId);
      
      if (!listing || listing.vendorId !== ownerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // NEW SYSTEM - BookingApplication
      application.status = 'rejected';
      await application.save();
      
      // Send notification to the specific applicant
      if (application.applicant) {
        const listingTitle = listing.title || listing.brand || 'the listing';
        const notification = await Notification.create({
          userId: application.applicant.id,
          type: 'booking',
          title: 'Application Status Update',
          message: `Your application for "${listingTitle}" was not approved. Keep browsing for other options!`,
          isRead: false,
          metadata: {
            listingId: listing.id,
            listingType: application.listingType,
            applicationId: bookingId
          }
        });

        if (io) {
          io.to(`user_${application.applicant.id}`).emit('new-notification', notification);
        }
      }
      
      console.log(`✅ Application ${bookingId} rejected (new system)`);
      return res.json({ message: 'Application rejected successfully', booking: application });
    }

    return res.status(404).json({ error: 'Booking/Application not found' });
  } catch (error) {
    console.error('❌ Error rejecting booking:', error);
    return res.status(500).json({ error: 'Failed to reject booking', details: error.message });
  }
});

module.exports = router;