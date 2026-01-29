// Public routes - No authentication required
const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get public listings for landing page (properties + bikes)
router.get('/listings', async (req, res) => {
  try {
    const { type = 'all', limit = 6 } = req.query;
    
    let properties = [];
    let bikes = [];

    // Fetch properties if type is 'all' or 'flats'
    if (type === 'all' || type === 'flats') {
      properties = await Property.findAll({
        where: { status: 'Available' },
        include: [{
          model: User,
          as: 'vendor',
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']],
        limit: type === 'all' ? Math.ceil(parseInt(limit) / 2) : parseInt(limit)
      });
    }

    // Fetch bikes if type is 'all' or 'bikes'
    if (type === 'all' || type === 'bikes') {
      bikes = await Bike.findAll({
        where: { status: 'Available' },
        include: [{
          model: User,
          as: 'vendor',
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']],
        limit: type === 'all' ? Math.floor(parseInt(limit) / 2) : parseInt(limit)
      });
    }

    // Format response
    const listings = [
      ...properties.map(p => ({
        id: p.id,
        type: 'property',
        title: p.title,
        location: p.city || p.address,
        price: `Rs ${p.rentPrice.toLocaleString()} per month`,
        priceValue: p.rentPrice,
        image: p.images && p.images.length > 0 ? p.images[0] : null,
        rating: (Math.random() * 2 + 3).toFixed(1), // Placeholder rating
        vendorName: p.vendor?.name,
        createdAt: p.createdAt
      })),
      ...bikes.map(b => ({
        id: b.id,
        type: 'bike',
        title: b.brand ? `${b.brand} ${b.model}` : b.model,
        location: b.location || 'Nepal',
        price: `Rs ${b.pricePerDay.toLocaleString()} per day`,
        priceValue: b.pricePerDay,
        image: b.images && b.images.length > 0 ? b.images[0] : null,
        rating: (Math.random() * 2 + 3).toFixed(1), // Placeholder rating
        vendorName: b.vendor?.name,
        createdAt: b.createdAt
      }))
    ];

    // Sort by most recent
    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Error fetching public listings:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch listings',
      listings: []
    });
  }
});

module.exports = router;
