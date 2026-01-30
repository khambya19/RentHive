const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const BikeBooking = require('../models/BikeBooking');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Bike = require('../models/Bike');
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

    // Calculate monthly revenue from properties (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const propertyRevenue = await Booking.sum('monthlyRent', {
      where: {
        vendorId: ownerId,
        status: ['Completed', 'Active'],
        createdAt: { [Op.gte]: startOfMonth }
      }
    }) || 0;

    // Calculate monthly revenue from bike rentals (current month)
    const bikeRevenue = await BikeBooking.sum('totalAmount', {
      where: {
        vendorId: ownerId,
        status: ['Completed', 'Active'],
        createdAt: { [Op.gte]: startOfMonth }
      }
    }) || 0;

    const monthlyRevenue = parseFloat(propertyRevenue) + parseFloat(bikeRevenue);
    console.log('💰 Monthly revenue (properties + bikes):', monthlyRevenue);

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

// Approve property booking
router.patch('/bookings/:bookingId/approve', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.id;

    const booking = await Booking.findOne({
      where: { id: bookingId, vendorId: ownerId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    booking.status = 'Active';
    await booking.save();

    console.log(`✅ Booking ${bookingId} approved and set to Active`);
    return res.json({ message: 'Booking approved successfully', booking });
  } catch (error) {
    console.error('❌ Error approving booking:', error);
    return res.status(500).json({ error: 'Failed to approve booking', details: error.message });
  }
});

// Reject property booking
router.patch('/bookings/:bookingId/reject', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ownerId = req.user.id;

    const booking = await Booking.findOne({
      where: { id: bookingId, vendorId: ownerId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    booking.status = 'Rejected';
    await booking.save();

    console.log(`✅ Booking ${bookingId} rejected`);
    return res.json({ message: 'Booking rejected successfully', booking });
  } catch (error) {
    console.error('❌ Error rejecting booking:', error);
    return res.status(500).json({ error: 'Failed to reject booking', details: error.message });
  }
});

module.exports = router;