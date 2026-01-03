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

// Get lessor dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const lessorId = req.user.id;

    // Get properties owned by this lessor
    const totalProperties = await Property.count({ 
      where: { vendorId: lessorId } 
    });
    
    const availableProperties = await Property.count({ 
      where: { vendorId: lessorId, status: 'Available' } 
    });

    // Get property bookings (where lessor is the property owner)
    const totalBookings = await Booking.count({ 
      where: { vendorId: lessorId } 
    });

    // Get bike rentals (where lessor is the bike renter)
    const bikeRentals = await BikeBooking.count({ 
      where: { lessorId: lessorId } 
    });

    // Calculate monthly revenue from properties (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Booking.sum('monthlyRent', {
      where: {
        vendorId: lessorId,
        status: ['Completed', 'Active'],
        createdAt: { [Op.gte]: startOfMonth }
      }
    }) || 0;

    return res.json({
      totalProperties,
      availableProperties,
      totalBookings,
      monthlyRevenue: parseFloat(monthlyRevenue),
      bikeRentals
    });
  } catch (error) {
    console.error('Error fetching lessor stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get lessor's bike bookings
router.get('/bike-bookings', async (req, res) => {
  try {
    const lessorId = req.user.id;

    const bookings = await BikeBooking.findAll({
      where: { lessorId },
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

// Get all bookings for lessor (property bookings + bike rentals)
router.get('/all-bookings', async (req, res) => {
  try {
    const lessorId = req.user.id;

    // Get property bookings where lessor is the property owner
    const propertyBookings = await Booking.findAll({
      where: { vendorId: lessorId },
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'fullName', 'phone', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'city', 'propertyType', 'images']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

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
        fullName: booking.tenant.fullName,
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

    // Get bike rentals where lessor is the bike renter
    const bikeBookings = await BikeBooking.findAll({
      where: { lessorId },
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

    return res.json({
      propertyBookings: transformedPropertyBookings,
      bikeBookings
    });
  } catch (error) {
    console.error('Error fetching all lessor bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch all bookings' });
  }
});

module.exports = router;