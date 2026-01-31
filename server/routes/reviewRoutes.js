const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Property = require('../models/Property');
const Bike = require('../models/Bike');


// GET /reviews?propertyId=...&bikeId=...&bookingId=...
router.get('/', async (req, res) => {
  try {
    const { propertyId, bikeId, bookingId } = req.query;
    const where = {};
    if (propertyId) where.propertyId = propertyId;
    if (bikeId) where.bikeId = bikeId;
    if (bookingId) where.bookingId = bookingId;
    const reviews = await Review.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/add', async (req, res) => {
  try {
    // Only allow propertyId, bikeId, or bookingId (at least one required)
    const { userId, reviewerName, rating, comment, propertyId, bikeId, bookingId } = req.body;
    if (!reviewerName || !rating || !comment || (!propertyId && !bikeId && !bookingId)) {
      return res.status(400).json({ error: 'Missing required fields or association.' });
    }
    
    // Log the incoming data for debugging
    console.log('📝 Review submission:', { userId, reviewerName, rating, propertyId, bikeId, bookingId });
    
    // Validate that property or bike exists
    if (propertyId) {
      const property = await Property.findByPk(propertyId);
      if (!property) {
        console.error('❌ Property not found:', propertyId);
        return res.status(400).json({ error: `Property with ID ${propertyId} does not exist.` });
      }
    }
    
    if (bikeId) {
      const bike = await Bike.findByPk(bikeId);
      if (!bike) {
        console.error('❌ Bike not found:', bikeId);
        return res.status(400).json({ error: `Bike with ID ${bikeId} does not exist.` });
      }
    }
    
    // Check if user already reviewed this property/bike
    if (userId) {
      const existingReview = await Review.findOne({
        where: {
          userId,
          ...(propertyId && { propertyId }),
          ...(bikeId && { bikeId })
        }
      });
      
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this listing.' });
      }
    }
    
    const newReview = await Review.create({ userId, reviewerName, rating, comment, propertyId, bikeId, bookingId });
    console.log('✅ Review created:', newReview.id);
    res.status(201).json(newReview);
  } catch (err) {
    console.error('❌ Review error:', err.message, err.stack);
    res.status(400).json({ error: err.message });
  }
});

// Update existing review
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required.' });
    }
    
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    
    // Update the review
    review.rating = rating;
    review.comment = comment;
    await review.save();
    
    console.log('✅ Review updated:', id);
    res.json(review);
  } catch (err) {
    console.error('❌ Review update error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;