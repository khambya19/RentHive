const Bike = require('../models/Bike');
const BikeBooking = require('../models/BikeBooking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const sendEmail = require('../utils/mailer');

// Get all available bikes for lessors to rent
exports.getAvailableBikes = async (req, res) => {
  try {
    const { search, type, location, minPrice, maxPrice, fuelType, minEngine, maxEngine, minYear, maxYear, features, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    let whereClause = { status: 'Available' };
    // Temporarily disabled isApproved check to show real user data immediately
    // whereClause.isApproved = true;

    // Search by brand, model, or name
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike || Op.like]: `%${search}%` } },
        { brand: { [Op.iLike || Op.like]: `%${search}%` } },
        { model: { [Op.iLike || Op.like]: `%${search}%` } },
        { description: { [Op.iLike || Op.like]: `%${search}%` } }
      ];
    }

    // Bike type filter
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    // ...rest of the code remains unchanged...
    
    // Location filter
    if (location) {
      whereClause.location = { [Op.iLike || Op.like]: `%${location}%` };
    }
    
    // Price range filter (daily rate)
    if (minPrice || maxPrice) {
      whereClause.dailyRate = {};
      if (minPrice) whereClause.dailyRate[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.dailyRate[Op.lte] = parseFloat(maxPrice);
    }

    // Fuel type filter
    if (fuelType && fuelType !== 'all') {
      whereClause.fuelType = fuelType;
    }

    // Engine capacity range filter
    if (minEngine || maxEngine) {
      whereClause.engineCapacity = {};
      if (minEngine) whereClause.engineCapacity[Op.gte] = parseFloat(minEngine);
      if (maxEngine) whereClause.engineCapacity[Op.lte] = parseFloat(maxEngine);
    }

    // Year range filter
    if (minYear || maxYear) {
      whereClause.year = {};
      if (minYear) whereClause.year[Op.gte] = parseInt(minYear);
      if (maxYear) whereClause.year[Op.lte] = parseInt(maxYear);
    }

    // Features filter (check if bike has all selected features)
    if (features) {
      const featuresList = features.split(',').map(f => f.trim());
      whereClause.features = {
        [Op.contains]: featuresList
      };
    }

    // Determine sort order
    let orderClause = [];
    const validSortFields = ['createdAt', 'dailyRate', 'weeklyRate', 'monthlyRate', 'year', 'engineCapacity', 'rating', 'name'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      orderClause.push([sortBy, sortOrder.toUpperCase()]);
    } else {
      orderClause.push(['createdAt', 'DESC']);
    }

    const bikes = await Bike.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'businessName', 'name', 'phone']
        }
      ],
      order: orderClause
    });

    return res.json(bikes.map(bike => ({
      ...bike.get({ plain: true }),
      id: bike.id,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      engineCapacity: bike.engineCapacity,
      fuelType: bike.fuelType,
      dailyRate: bike.dailyRate,
      weeklyRate: bike.weeklyRate,
      monthlyRate: bike.monthlyRate,
      securityDeposit: bike.securityDeposit,
      features: bike.features,
      description: bike.description,
      images: bike.images,
      location: bike.location,
      pickupLocation: bike.pickupLocation,
      licenseRequired: bike.licenseRequired,
      minimumAge: bike.minimumAge,
      rating: bike.rating,
      ratingCount: bike.ratingCount,
      vendorId: bike.vendorId,
      vendorName: bike.vendor?.businessName || bike.vendor?.name,
      vendorPhone: bike.vendor?.phone
    })));
  } catch (error) {
    console.error('Error fetching available bikes:', error);
    // Instead of 500, return empty array for public/browse
    return res.json([]);
  }
};

// Book a bike (lessor action)
exports.bookBike = async (req, res) => {
  try {
    const lessorId = req.user.id;
    const { bikeId, vendorId, startDate, endDate, message } = req.body;

    console.log('📍 Bike booking request:', { lessorId, bikeId, vendorId, startDate, endDate });

    // Validate required fields
    if (!bikeId || !vendorId || !startDate || !endDate) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: bikeId, vendorId, startDate, endDate' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }
    
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Get bike details and lessor info
    const bike = await Bike.findOne({ 
      where: { id: bikeId, vendorId, status: 'Available' },
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'businessName', 'name']
        }
      ]
    });
    
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found or not available' });
    }

    // Get lessor info
    const lessor = await User.findByPk(lessorId, {
      attributes: ['id', 'name', 'email', 'phone']
    });

    // Prevent self-booking
    if (bike.vendorId === lessorId) {
      return res.status(400).json({ error: 'You cannot book your own bike' });
    }

    // Check for conflicting bookings
    const conflictingBooking = await BikeBooking.findOne({
      where: {
        bikeId,
        status: ['Pending', 'Approved', 'Active'],
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

    if (conflictingBooking) {
      return res.status(400).json({ error: 'Bike is already booked for these dates' });
    }

    // Calculate total amount
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let totalAmount;
    
    // Use pro-rated logic for fair dynamic pricing
    const dailyRate = parseFloat(bike.dailyRate);
    const weeklyRate = parseFloat(bike.weeklyRate || 0);
    const monthlyRate = parseFloat(bike.monthlyRate || 0);

    if (totalDays >= 30 && monthlyRate > 0) {
      // Pro-rated Monthly Rate
      totalAmount = (monthlyRate / 30) * totalDays;
    } else if (totalDays >= 7 && weeklyRate > 0) {
      // Pro-rated Weekly Rate
      totalAmount = (weeklyRate / 7) * totalDays;
    } else {
      // Daily Rate
      totalAmount = dailyRate * totalDays;
    }
    
    // Ensure 2 decimal precision
    totalAmount = parseFloat(totalAmount.toFixed(2));

    const booking = await BikeBooking.create({
      lessorId,
      vendorId,
      bikeId,
      startDate,
      endDate,
      totalDays,
      dailyRate: bike.dailyRate,
      totalAmount,
      securityDeposit: bike.securityDeposit,
      message: message || '',
      status: 'Pending'
    });

    // Send notification to vendor
    try {
      const notificationTitle = '🏍️ New Bike Rental Request';
      const notificationMessage = `${lessor.name} wants to rent your ${bike.brand} ${bike.model} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. Total: NPR ${totalAmount.toLocaleString()}`;
      
      const notification = await Notification.create({
        user_id: vendorId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'info',
        is_broadcast: false,
        link: `/owner/dashboard?tab=bookings`,
        metadata: JSON.stringify({
          bookingId: booking.id,
          bikeId: bike.id,
          lessorId: lessor.id,
          requiresAction: true
        })
      });

      console.log('✅ Bike booking notification created:', notification.id);
      console.log(`📧 Sending bike booking notification to vendor ${vendorId}`);

      // Emit real-time notification via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${vendorId}`).emit('new-notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
          is_read: false,
          created_at: notification.created_at,
          is_broadcast: false,
          metadata: notification.metadata
        });
        console.log(`✅ Real-time notification sent to vendor ${vendorId}`);
      } else {
        console.log('⚠️ Socket.IO not available, notification saved to database only');
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    return res.json({
      id: booking.id,
      message: 'Bike booking request sent successfully',
      totalAmount: booking.totalAmount,
      totalDays: booking.totalDays
    });
  } catch (error) {
    console.error('Error booking bike:', error);
    return res.status(500).json({ error: 'Failed to book bike' });
  }
};

// Book a bike directly (lessor action) - Auto-approved for available bikes
exports.bookBikeDirect = async (req, res) => {
  try {
    const lessorId = req.user.id;
    const { bikeId, vendorId, startDate, endDate, message } = req.body;

    // Validate required fields
    if (!bikeId || !vendorId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields: bikeId, vendorId, startDate, endDate' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }
    
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Get bike details
    const bike = await Bike.findOne({ 
      where: { id: bikeId, vendorId, status: 'Available' }
    });
    
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found or not available' });
    }

    // Get lessor info
    const lessor = await User.findByPk(lessorId, {
      attributes: ['id', 'name', 'email', 'phone']
    });

    if (!lessor) {
      return res.status(404).json({ error: 'Lessor not found' });
    }

    // Prevent self-booking
    if (bike.vendorId === lessorId) {
      return res.status(400).json({ error: 'You cannot book your own bike' });
    }

    // Check for conflicting bookings
    const conflictingBooking = await BikeBooking.findOne({
      where: {
        bikeId,
        status: ['Pending', 'Approved', 'Active'],
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

    if (conflictingBooking) {
      return res.status(400).json({ error: 'Bike is already booked for these dates' });
    }

    // Calculate total amount
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let totalAmount;
    
    if (totalDays >= 30 && bike.monthlyRate) {
      // Monthly rate if available
      totalAmount = parseFloat(bike.monthlyRate) * Math.ceil(totalDays / 30);
    } else if (totalDays >= 7 && bike.weeklyRate) {
      // Weekly rate (fallback to daily rate if weeklyRate not set)
      totalAmount = parseFloat(bike.weeklyRate) * Math.ceil(totalDays / 7);
    } else {
      // Daily rate
      totalAmount = parseFloat(bike.dailyRate) * totalDays;
    }

    // Create booking with 'Approved' status (auto-approved)
    const booking = await BikeBooking.create({
      lessorId,
      vendorId,
      bikeId,
      startDate,
      endDate,
      totalDays,
      dailyRate: parseFloat(bike.dailyRate),
      totalAmount,
      securityDeposit: parseFloat(bike.securityDeposit),
      message: message || '',
      status: 'Approved' // Auto-approved for available bikes
    });

    // Update bike status to 'Rented' since it's auto-approved
    await Bike.update(
      { status: 'Rented' },
      { where: { id: bikeId } }
    );

    // Send notification to vendor about the confirmed booking
    try {
      const { io, connectedUsers } = require('../server');
      
      const notificationTitle = '🏍️ New Bike Rental Confirmed';
      const notificationMessage = `${lessor.name} has booked your ${bike.brand} ${bike.model} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. Total: NPR ${totalAmount.toLocaleString()}. Booking ID: #${booking.id}`;
      
      const notification = await Notification.create({
        user_id: vendorId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'info',
        is_broadcast: false,
        link: `/owner/dashboard?tab=bookings`
      });

      console.log('✅ Bike direct booking notification created:', notification.id);

      if (io && connectedUsers) {
        const socketId = connectedUsers.get(vendorId.toString());
        if (socketId) {
          io.to(socketId).emit('new-notification', {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            is_read: false,
            created_at: notification.created_at,
            is_broadcast: false
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    return res.status(200).json({
      success: true,
      id: booking.id,
      message: 'Bike booked successfully',
      totalAmount: booking.totalAmount,
      totalDays: booking.totalDays,
      status: 'Approved',
      booking: {
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalDays: booking.totalDays,
        totalAmount: booking.totalAmount,
        securityDeposit: booking.securityDeposit,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error booking bike directly:', error);
    return res.status(500).json({ 
      error: 'Failed to book bike',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get vendor's bikes (for vendor dashboard)
exports.getVendorBikes = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.error('getVendorBikes: User not authenticated or ID missing');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const vendorId = req.user.id;
    console.log(`Fetching bikes for vendor: ${vendorId}`);
    
    // Explicitly select all attributes to ensure new fields are included if not by default
    const bikes = await Bike.findAll({
      where: { vendorId },
      order: [['createdAt', 'DESC']]
    });

    return res.json(bikes);
  } catch (error) {
    console.error('Error fetching vendor bikes:', error);
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch bikes';
    return res.status(500).json({ error: errorMessage });
  }
};

// Create new bike (vendor action)
exports.createBike = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    // Check if user is verified
    const user = await User.findByPk(vendorId);
    if (!user || !user.isVerified || user.kycStatus !== 'approved') {
      return res.status(403).json({ error: 'You must complete KYC verification to post listings.' });
    }

    const {
      name, brand, model, type, year, engineCapacity, fuelType,
      dailyRate, weeklyRate, monthlyRate, securityDeposit,
      features, description, location, pickupLocation,

      licenseRequired, minimumAge, status, color, registrationNumber,
      latitude, longitude
    } = req.body;


    // Handle Features parsing (FormData sends as string)
    let parsedFeatures = [];
    if (typeof features === 'string') {
      try {
         parsedFeatures = JSON.parse(features);
      } catch (e) {
         parsedFeatures = [];
      }
    } else if (Array.isArray(features)) {
      parsedFeatures = features;
    }

    // Handle Images from Multer
    let imageFilenames = [];
    if (req.files && req.files.length > 0) {
      imageFilenames = req.files.map(file => file.filename);

    }

    // Map frontend bike types to database enum values
    const typeMapping = {
      'Mountain': 'Bicycle',
      'Road': 'Bicycle', 
      'Electric': 'Electric Bike',
      'Hybrid': 'Electric Bike',
      'BMX': 'Bicycle',
      'Cruiser': 'Bicycle',
      'Motorcycle': 'Motorcycle',
      'Scooter': 'Scooter'
    };

    const mappedType = typeMapping[type] || 'Bicycle';

    // Calculate weekly rate if not provided (6 days worth of daily rate)
    const calculatedWeeklyRate = weeklyRate && weeklyRate !== '' ? parseFloat(weeklyRate) : parseFloat(dailyRate) * 6;

    const bike = await Bike.create({
      vendorId,
      name: name || `${brand} ${model}`, // Use provided name or create from brand/model
      brand,
      model,
      type: mappedType,
      year: parseInt(year),
      engineCapacity: engineCapacity ? parseInt(engineCapacity) : null,
      fuelType: fuelType || 'Petrol',
      dailyRate: parseFloat(dailyRate),
      weeklyRate: calculatedWeeklyRate,
      monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
      securityDeposit: parseFloat(securityDeposit),
      features: parsedFeatures,
      description,
      description,
      images: imageFilenames,
      location,
      pickupLocation,
      color,
      registrationNumber,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      licenseRequired: licenseRequired === 'true' || licenseRequired === true,
      minimumAge: minimumAge ? parseInt(minimumAge) : 18,
      status: status || 'Available',
      isApproved: true, // Auto-approved by default
      color,
      registrationNumber
    });


    // Get vendor info for notification
    const vendor = await User.findByPk(vendorId, {
      attributes: ['businessName', 'name']
    });

    // Send broadcast notification to all lessors about the new bike
    try {
      const { createBroadcast } = require('./notificationController');
      
      const notificationTitle = `🏍️ New Bike Available for Rent!`;
      const notificationMessage = `${vendor?.businessName || vendor?.name || 'A vendor'} just added a ${brand} ${model} (${type}) available for rent at NPR ${parseInt(dailyRate).toLocaleString()}/day in ${location}. Book it now!`;
      
      await createBroadcast({
        body: {
          title: notificationTitle,
          message: notificationMessage,
          type: 'bike_available',
          link: `/lessor/bikes/${bike.id}`
        }
      }, {
        status: (code) => ({
          json: (data) => console.log('Bike availability notification broadcast:', data)
        })
      });
    } catch (notificationError) {
      console.error('Error sending bike availability notification:', notificationError);
      // Don't fail the bike creation if notification fails
    }

    return res.json(bike);
  } catch (error) {
    console.error('Error creating bike:', error);
    return res.status(500).json({ error: 'Failed to create bike listing' });
  }
};

// Update bike (vendor action)
exports.updateBike = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const bike = await Bike.findOne({ where: { id, vendorId } });
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    const updateData = { ...req.body };
    
    // Process uploaded image files if any (store filenames)
    if (req.files && req.files.length > 0) {
      const imageFilenames = req.files.map(file => file.filename);
      updateData.images = imageFilenames;
    }
    
    // Parse features if it's a JSON string
    if (updateData.features && typeof updateData.features === 'string') {
      try {
        updateData.features = JSON.parse(updateData.features);
      } catch (e) {
        // keep as is or empty if error
      }
    }

    // Map frontend bike types to database enum values if type is updated
    if (updateData.type) {
      const typeMapping = {
        'Mountain': 'Bicycle',
        'Road': 'Bicycle', 
        'Electric': 'Electric Bike',
        'Hybrid': 'Electric Bike',
        'BMX': 'Bicycle',
        'Cruiser': 'Bicycle',
        'Motorcycle': 'Motorcycle',
        'Scooter': 'Scooter',
        'Sport Bike': 'Motorcycle'
      };

      if (typeMapping[updateData.type]) {
        updateData.type = typeMapping[updateData.type];
      }
    }
    
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.engineCapacity) updateData.engineCapacity = parseInt(updateData.engineCapacity);
    if (updateData.dailyRate) updateData.dailyRate = parseFloat(updateData.dailyRate);
    if (updateData.weeklyRate) updateData.weeklyRate = parseFloat(updateData.weeklyRate);
    if (updateData.monthlyRate) updateData.monthlyRate = parseFloat(updateData.monthlyRate);
    if (updateData.securityDeposit) updateData.securityDeposit = parseFloat(updateData.securityDeposit);
    if (updateData.minimumAge) updateData.minimumAge = parseInt(updateData.minimumAge);

    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    
    // Ensure string fields are assigned if present (explicit check often helps if only in body)
    if (req.body.color) updateData.color = req.body.color;
    if (req.body.registrationNumber) updateData.registrationNumber = req.body.registrationNumber;

    await bike.update(updateData);

    return res.json(bike);
  } catch (error) {
    console.error('Error updating bike:', error);
    return res.status(500).json({ error: 'Failed to update bike' });
  }
};

// Delete bike (vendor action)
exports.deleteBike = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const bike = await Bike.findOne({ where: { id, vendorId } });
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    // Check for active bookings
    const activeBooking = await BikeBooking.findOne({
      where: {
        bikeId: id,
        status: ['Approved', 'Active']
      }
    });

    if (activeBooking) {
      return res.status(400).json({ error: 'Cannot delete bike with active bookings' });
    }

    await bike.destroy();

    return res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    console.error('Error deleting bike:', error);
    return res.status(500).json({ error: 'Failed to delete bike' });
  }
};

// Get vendor bike bookings
exports.getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const bookings = await BikeBooking.findAll({
      where: { vendorId },
      include: [
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'email', 'phone', 'profileImage']
        },
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'brand', 'model', 'type', 'images']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format the response to include customer name properly
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      lessorId: booking.lessorId,
      vendorId: booking.vendorId,
      bikeId: booking.bikeId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalDays: booking.totalDays,
      dailyRate: booking.dailyRate,
      totalAmount: booking.totalAmount,
      securityDeposit: booking.securityDeposit,
      message: booking.message,
      status: booking.status,
      pickupTime: booking.pickupTime,
      returnTime: booking.returnTime,
      vendorNotes: booking.vendorNotes,
      rating: booking.rating,
      review: booking.review,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      // Customer information
      customer: {
        id: booking.lessor?.id,
        name: booking.lessor?.name || 'N/A',
        fullName: booking.lessor?.name,
        email: booking.lessor?.email,
        phone: booking.lessor?.phone,
        profileImage: booking.lessor?.profileImage
      },
      // Bike information
      bike: {
        id: booking.bike?.id,
        brand: booking.bike?.brand,
        model: booking.bike?.model,
        type: booking.bike?.type,
        name: `${booking.bike?.brand || ''} ${booking.bike?.model || ''}`.trim() || 'N/A',
        images: booking.bike?.images || []
      },
      // Legacy fields for backward compatibility
      lessor: booking.lessor
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching vendor bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Update booking status (vendor action)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vendorNotes } = req.body;
    const vendorId = req.user.id;

    const booking = await BikeBooking.findOne({
      where: { id, vendorId },
      include: [
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Bike,
          as: 'bike',
          attributes: ['id', 'brand', 'model', 'type']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await booking.update({ 
      status, 
      vendorNotes: vendorNotes || booking.vendorNotes 
    });

    // Update bike status based on booking status
    if (status === 'Active') {
      await Bike.update(
        { status: 'Rented' },
        { where: { id: booking.bikeId } }
      );
    } else if (['Completed', 'Cancelled', 'Rejected'].includes(status)) {
      await Bike.update(
        { status: 'Available' },
        { where: { id: booking.bikeId } }
      );
    }

    // Send notification to lessor based on status change
    try {
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers');
      
      let notificationTitle = '';
      let notificationMessage = '';
      
      switch (status) {
        case 'Approved':
          notificationTitle = '✅ Booking Approved!';
          notificationMessage = `Your booking for ${booking.bike.brand} ${booking.bike.model} has been approved! Rental period: ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}. Total: NPR ${booking.totalAmount.toLocaleString()}`;
          break;
        case 'Rejected':
          notificationTitle = '❌ Booking Rejected';
          notificationMessage = `Unfortunately, your booking request for ${booking.bike.brand} ${booking.bike.model} has been rejected. ${vendorNotes ? 'Reason: ' + vendorNotes : ''}`;
          break;
        case 'Active':
          notificationTitle = '🏍️ Rental Started';
          notificationMessage = `Your rental of ${booking.bike.brand} ${booking.bike.model} is now active. Enjoy your ride and stay safe!`;
          break;
        case 'Completed':
          notificationTitle = '🎉 Rental Completed';
          notificationMessage = `Your rental of ${booking.bike.brand} ${booking.bike.model} has been completed. Thank you for choosing us!`;
          break;
        case 'Cancelled':
          notificationTitle = '🚫 Booking Cancelled';
          notificationMessage = `Your booking for ${booking.bike.brand} ${booking.bike.model} has been cancelled. ${vendorNotes ? 'Reason: ' + vendorNotes : ''}`;
          break;
      }
      
      if (notificationTitle && notificationMessage) {
        const notification = await Notification.create({
          user_id: booking.lessorId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'info',
          is_broadcast: false,
          link: `/user/dashboard?tab=rentals`
        });

        console.log(`📧 Sending bike status update to lessor ${booking.lessorId}`);
        
        // Send email if booking is approved
        if (status === 'Approved' && booking.lessor && booking.lessor.email) {
          try {
            const startDate = new Date(booking.startDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            const endDate = new Date(booking.endDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">🎉 Your Bike Rental Has Been Approved!</h2>
                <p>Dear ${booking.lessor.name},</p>
                <p>Great news! Your bike rental request has been approved by the vendor.</p>
                
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1F2937;">Bike Details</h3>
                  <p><strong>Bike:</strong> ${booking.bike.brand} ${booking.bike.model}</p>
                  <p><strong>Type:</strong> ${booking.bike.type}</p>
                  <p><strong>Rental Period:</strong> ${startDate} to ${endDate}</p>
                  <p><strong>Total Days:</strong> ${booking.totalDays}</p>
                  <p><strong>Daily Rate:</strong> NPR ${parseInt(booking.dailyRate).toLocaleString()}</p>
                  <p><strong>Total Amount:</strong> NPR ${parseInt(booking.totalAmount).toLocaleString()}</p>
                  ${booking.securityDeposit ? `<p><strong>Security Deposit:</strong> NPR ${parseInt(booking.securityDeposit).toLocaleString()}</p>` : ''}
                </div>
                
                <p>Please log in to your dashboard to view more details and arrange for pickup.</p>
                <a href="http://localhost:5173/user/dashboard?tab=rentals" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View My Bookings</a>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">Best regards,<br>RentHive Team</p>
              </div>
            `;
            
            await sendEmail({
              to: booking.lessor.email,
              subject: `🎉 Bike Rental Approved - ${booking.bike.brand} ${booking.bike.model}`,
              html: emailHtml,
              text: `Your rental for ${booking.bike.brand} ${booking.bike.model} has been approved! Rental period: ${startDate} to ${endDate}. Total: NPR ${parseInt(booking.totalAmount).toLocaleString()}`
            });
            
            console.log(`✅ Approval email sent to ${booking.lessor.email}`);
          } catch (emailError) {
            console.error('Error sending approval email:', emailError);
            // Don't fail the approval if email fails
          }
        }

        if (io && connectedUsers) {
          const userSocketId = connectedUsers.get(`user_${booking.lessorId}`);
          if (userSocketId) {
            io.to(userSocketId).emit('new-notification', {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              link: notification.link,
              is_read: false,
              created_at: notification.createdAt,
              is_broadcast: false
            });
            console.log(`✅ Bike booking status notification sent to lessor ${booking.lessorId}`);
          } else {
            console.log(`⚠️ Lessor ${booking.lessorId} not connected to socket`);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification to lessor:', notificationError);
      // Don't fail the status update if notification fails
    }

    return res.json({ 
      message: 'Booking status updated successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        lessor: booking.lessor,
        bike: booking.bike
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// Upload bike images
exports.uploadBikeImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const filenames = req.files.map(file => file.filename);

    return res.json({
      success: true,
      images: filenames
    });
  } catch (error) {
    console.error('Error uploading bike images:', error);
    return res.status(500).json({ error: 'Failed to upload images' });
  }
};

// Get vendor bike stats for dashboard
exports.getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get total bikes count
    const totalBikes = await Bike.count({ where: { vendorId } });
    
    // Get available bikes count
    const availableBikes = await Bike.count({ 
      where: { vendorId, status: 'Available' } 
    });

    // Get active rentals count
    const activeRentals = await BikeBooking.count({
      where: { 
        vendorId, 
        status: ['Approved', 'Active'] 
      }
    });

    // Get total bookings count
    const totalBookings = await BikeBooking.count({ where: { vendorId } });

    // Get pending bookings count
    const pendingBookings = await BikeBooking.count({
      where: { vendorId, status: 'Pending' }
    });

    // Calculate monthly revenue (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await BikeBooking.sum('totalAmount', {
      where: {
        vendorId,
        status: ['Completed', 'Active'],
        createdAt: { [Op.gte]: startOfMonth }
      }
    }) || 0;

    return res.json({
      stats: {
        totalBikes,
        availableBikes,
        activeRentals,
        totalBookings,
        pendingBookings,
        monthlyRevenue: parseFloat(monthlyRevenue)
      }
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Get vendor customers (for customer management)
exports.getVendorCustomers = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get unique customers who have booked with this vendor
    const bookings = await BikeBooking.findAll({
      where: { vendorId },
      include: [
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'email', 'phone', 'profileImage', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group by customer and calculate stats
    const customerMap = new Map();
    
    bookings.forEach(booking => {
      const customerId = booking.lessor.id;
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          fullName: booking.lessor.name,
          email: booking.lessor.email,
          phone: booking.lessor.phone,
          profileImage: booking.lessor.profileImage,
          createdAt: booking.lessor.createdAt,
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: null,
          recentBookings: []
        });
      }

      const customer = customerMap.get(customerId);
      customer.totalBookings += 1;
      customer.totalSpent += parseFloat(booking.totalAmount || 0);
      
      if (!customer.lastBookingDate || new Date(booking.createdAt) > new Date(customer.lastBookingDate)) {
        customer.lastBookingDate = booking.createdAt;
      }

      if (customer.recentBookings.length < 5) {
        customer.recentBookings.push({
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount,
          status: booking.status,
          bike: {
            name: `${booking.bike?.brand} ${booking.bike?.model}`,
            type: booking.bike?.type
          }
        });
      }
    });

    const customers = Array.from(customerMap.values());

    return res.json({ customers });
  } catch (error) {
    console.error('Error fetching vendor customers:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Approve bike booking
exports.approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.user.id;

    const booking = await BikeBooking.findOne({
      where: { id: bookingId, vendorId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    booking.status = 'Active';
    await booking.save();

    console.log(`✅ Bike booking ${bookingId} approved and set to Active`);
    return res.json({ message: 'Booking approved successfully', booking });
  } catch (error) {
    console.error('❌ Error approving bike booking:', error);
    return res.status(500).json({ error: 'Failed to approve booking', details: error.message });
  }
};

// Reject bike booking
exports.rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const vendorId = req.user.id;

    const booking = await BikeBooking.findOne({
      where: { id: bookingId, vendorId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    booking.status = 'Rejected';
    await booking.save();

    console.log(`✅ Bike booking ${bookingId} rejected`);
    return res.json({ message: 'Booking rejected successfully', booking });
  } catch (error) {
    console.error('❌ Error rejecting bike booking:', error);
    return res.status(500).json({ error: 'Failed to reject booking', details: error.message });
  }
};

// Get single bike details for viewing
exports.getBikeById = async (req, res) => {
  try {
    const { id } = req.params;
    const bike = await Bike.findByPk(id, {
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'name', 'email', 'phone', 'businessName', 'profileImage']
        }
      ]
    });

    if (!bike) {
      return res.status(404).json({ error: 'Automobile not found' });
    }

    // Increment booking count as "view" for bikes or handle differently
    // Actually just return the data
    return res.json({
      id: bike.id,
      name: bike.name || `${bike.brand} ${bike.model}`,
      brand: bike.brand,
      model: bike.model,
      type: bike.type,
      year: bike.year,
      engineCapacity: bike.engineCapacity,
      fuelType: bike.fuelType,
      dailyRate: bike.dailyRate,
      weeklyRate: bike.weeklyRate,
      monthlyRate: bike.monthlyRate,
      securityDeposit: bike.securityDeposit,
      features: bike.features,
      description: bike.description,
      images: bike.images,
      status: bike.status,
      location: bike.location,
      pickupLocation: bike.pickupLocation,
      licenseRequired: bike.licenseRequired,
      minimumAge: bike.minimumAge,
      rating: bike.rating,
      ratingCount: bike.ratingCount,
      vendor: bike.vendor,
      createdAt: bike.createdAt,
      color: bike.color,
      registrationNumber: bike.registrationNumber
    });
  } catch (error) {
    console.error('Error fetching bike by ID:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = exports;