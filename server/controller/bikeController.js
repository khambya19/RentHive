const Bike = require('../models/Bike');
const BikeBooking = require('../models/BikeBooking');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get all available bikes for lessors to rent
exports.getAvailableBikes = async (req, res) => {
  try {
    const { search, type, location, minPrice, maxPrice } = req.query;
    
    let whereClause = { status: 'Available' };
    
    // Apply filters
    if (search) {
      whereClause[Op.or] = [
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
    if (location) {
      whereClause.location = { [Op.like]: `%${location}%` };
    }
    
    if (minPrice || maxPrice) {
      whereClause.dailyRate = {};
      if (minPrice) whereClause.dailyRate[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.dailyRate[Op.lte] = parseFloat(maxPrice);
    }

    const bikes = await Bike.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'businessName', 'fullName', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(bikes.map(bike => ({
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
      vendorName: bike.vendor?.businessName || bike.vendor?.fullName,
      vendorPhone: bike.vendor?.phone
    })));
  } catch (error) {
    console.error('Error fetching available bikes:', error);
    return res.status(500).json({ error: 'Failed to fetch bikes' });
  }
};

// Book a bike (lessor action)
exports.bookBike = async (req, res) => {
  try {
    const lessorId = req.user.id;
    const { bikeId, vendorId, startDate, endDate, message } = req.body;

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
          attributes: ['id', 'businessName', 'fullName']
        }
      ]
    });
    
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found or not available' });
    }

    // Get lessor info
    const lessor = await User.findByPk(lessorId, {
      attributes: ['id', 'fullName', 'email', 'phone']
    });

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
    
    if (totalDays >= 30) {
      // Monthly rate if available
      totalAmount = bike.monthlyRate ? bike.monthlyRate * Math.ceil(totalDays / 30) : bike.dailyRate * totalDays;
    } else if (totalDays >= 7) {
      // Weekly rate (fallback to daily rate if weeklyRate not set)
      totalAmount = bike.weeklyRate ? bike.weeklyRate * Math.ceil(totalDays / 7) : bike.dailyRate * totalDays;
    } else {
      // Daily rate
      totalAmount = bike.dailyRate * totalDays;
    }

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
      const { createUserNotification } = require('./notificationController');
      
      const notificationTitle = `🏍️ New Bike Rental Request`;
      const notificationMessage = `${lessor.fullName} wants to rent your ${bike.brand} ${bike.model} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. Total: NPR ${totalAmount.toLocaleString()}`;
      
      await createUserNotification({
        body: {
          userId: vendorId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'booking',
          link: `/vendor/bookings/${booking.id}`
        }
      }, {
        status: (code) => ({
          json: (data) => console.log('Notification created:', data)
        })
      });
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
      attributes: ['id', 'fullName', 'email', 'phone']
    });

    if (!lessor) {
      return res.status(404).json({ error: 'Lessor not found' });
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
      const { createUserNotification } = require('./notificationController');
      
      const notificationTitle = `🏍️ New Bike Rental Confirmed`;
      const notificationMessage = `${lessor.fullName} has booked your ${bike.brand} ${bike.model} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}. Total: NPR ${totalAmount.toLocaleString()}. Booking ID: #${booking.id}`;
      
      await createUserNotification({
        body: {
          userId: vendorId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'booking',
          link: `/vendor/bookings/${booking.id}`
        }
      }, {
        status: (code) => ({
          json: (data) => console.log('Notification created:', data)
        })
      });
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
    const vendorId = req.user.id;
    
    const bikes = await Bike.findAll({
      where: { vendorId },
      order: [['createdAt', 'DESC']]
    });

    return res.json(bikes);
  } catch (error) {
    console.error('Error fetching vendor bikes:', error);
    return res.status(500).json({ error: 'Failed to fetch bikes' });
  }
};

// Create new bike (vendor action)
exports.createBike = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      name, brand, model, type, year, engineCapacity, fuelType,
      dailyRate, weeklyRate, monthlyRate, securityDeposit,
      features, description, images, location, pickupLocation,
      licenseRequired, minimumAge, status
    } = req.body;

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

    const bike = await Bike.create({
      vendorId,
      name: name || `${brand} ${model}`, // Use provided name or create from brand/model
      brand,
      model,
      type: mappedType,
      year: parseInt(year),
      engineCapacity: engineCapacity ? parseInt(engineCapacity) : null,
      fuelType,
      dailyRate: parseFloat(dailyRate),
      weeklyRate: parseFloat(weeklyRate),
      monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
      securityDeposit: parseFloat(securityDeposit),
      features: features || [],
      description,
      images: images || [],
      location,
      pickupLocation,
      licenseRequired: licenseRequired !== false,
      minimumAge: minimumAge ? parseInt(minimumAge) : 18,
      status: status || 'Available'
    });

    // Get vendor info for notification
    const vendor = await User.findByPk(vendorId, {
      attributes: ['businessName', 'fullName']
    });

    // Send broadcast notification to all lessors about the new bike
    try {
      const { createBroadcast } = require('./notificationController');
      
      const notificationTitle = `🏍️ New Bike Available for Rent!`;
      const notificationMessage = `${vendor?.businessName || vendor?.fullName || 'A vendor'} just added a ${brand} ${model} (${type}) available for rent at NPR ${parseInt(dailyRate).toLocaleString()}/day in ${location}. Book it now!`;
      
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
    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.engineCapacity) updateData.engineCapacity = parseInt(updateData.engineCapacity);
    if (updateData.dailyRate) updateData.dailyRate = parseFloat(updateData.dailyRate);
    if (updateData.weeklyRate) updateData.weeklyRate = parseFloat(updateData.weeklyRate);
    if (updateData.monthlyRate) updateData.monthlyRate = parseFloat(updateData.monthlyRate);
    if (updateData.securityDeposit) updateData.securityDeposit = parseFloat(updateData.securityDeposit);
    if (updateData.minimumAge) updateData.minimumAge = parseInt(updateData.minimumAge);

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
          attributes: ['id', 'fullName', 'email', 'phone', 'profileImage']
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
        name: booking.lessor?.fullName || 'N/A',
        fullName: booking.lessor?.fullName,
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
          attributes: ['id', 'fullName', 'email', 'phone']
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
      const { createUserNotification } = require('./notificationController');
      
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
        await createUserNotification({
          body: {
            userId: booking.lessorId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'booking',
            link: `/lessor/bookings/${booking.id}`
          }
        }, {
          status: (code) => ({
            json: (data) => console.log('Notification sent to lessor:', data)
          })
        });
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
          attributes: ['id', 'fullName', 'email', 'phone', 'profileImage', 'createdAt']
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
          fullName: booking.lessor.fullName,
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

module.exports = exports;