const Property = require('../models/Property');
const Booking = require('../models/Booking');
const PropertyView = require('../models/PropertyView');
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get all available properties for browsing (tenant/lessor)
exports.getAvailableProperties = async (req, res) => {
  try {
    const { search, city, minPrice, maxPrice, type } = req.query;

    const whereClause = { status: 'Available' };

    if (type) {
      whereClause.propertyType = type;
    }
    if (city) {
      whereClause.city = { [Op.iLike || Op.like]: `%${city}%` };
    }
    if (minPrice || maxPrice) {
      whereClause.rentPrice = {};
      if (minPrice) whereClause.rentPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.rentPrice[Op.lte] = parseFloat(maxPrice);
    }
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike || Op.like]: `%${search}%` } },
        { address: { [Op.iLike || Op.like]: `%${search}%` } },
        { city: { [Op.iLike || Op.like]: `%${search}%` } }
      ];
    }

    const properties = await Property.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.json(properties.map(p => ({
      id: p.id,
      title: p.title,
      propertyType: p.propertyType,
      address: p.address,
      city: p.city,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      rentPrice: p.rentPrice,
      securityDeposit: p.securityDeposit,
      amenities: p.amenities,
      description: p.description,
      images: p.images,
      status: p.status,
      latitude: p.latitude,
      longitude: p.longitude,
      createdAt: p.createdAt
    })));
  } catch (error) {
    console.error('Error fetching available properties:', error);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

// Get all properties for a vendor
exports.getVendorProperties = async (req, res) => {
  try {
    const vendorId = req.user.id;
    
    const properties = await Property.findAll({
      where: { vendorId },
      order: [['createdAt', 'DESC']]
    });

    return res.json(properties.map(p => ({
      id: p.id,
      title: p.title,
      propertyType: p.propertyType,
      address: p.address,
      city: p.city,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      rentPrice: p.rentPrice,
      securityDeposit: p.securityDeposit,
      amenities: p.amenities,
      description: p.description,
      images: p.images,
      status: p.status,
      latitude: p.latitude,
      longitude: p.longitude,
      viewCount: p.viewCount,
      inquiryCount: p.inquiryCount,
      createdAt: p.createdAt
    })));
  } catch (error) {
    console.error('Error fetching vendor properties:', error);
    return res.status(500).json({ error: 'Failed to fetch properties' });
  }
};

// Get vendor dashboard stats
exports.getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get all properties
    const properties = await Property.findAll({ where: { vendorId } });
    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.status === 'Available').length;

    // Get active bookings
    const activeBookings = await Booking.findAll({
      where: {
        vendorId,
        status: 'Active'
      }
    });

    // Calculate monthly revenue from active leases
    const monthlyRevenue = activeBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.monthlyRent);
    }, 0);

    // Get total views
    const totalViews = properties.reduce((sum, p) => sum + p.viewCount, 0);

    // Get total inquiries
    const totalInquiries = properties.reduce((sum, p) => sum + p.inquiryCount, 0);

    // Get all bookings
    const allBookings = await Booking.findAll({
      where: { vendorId },
      include: [
        { model: User, as: 'tenant', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: Property, as: 'property', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      totalProperties,
      availableProperties,
      activeTenants: activeBookings.length,
      monthlyRevenue,
      totalViews,
      totalInquiries,
      bookings: allBookings.map(b => ({
        id: b.id,
        tenant: b.tenant,
        property: b.property,
        moveInDate: b.moveInDate,
        moveOutDate: b.moveOutDate,
        monthlyRent: b.monthlyRent,
        status: b.status,
        message: b.message,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Create new property
exports.createProperty = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      title,
      propertyType,
      address,
      city,
      bedrooms,
      bathrooms,
      area,
      rentPrice,
      securityDeposit,
      amenities,
      description,
      images,
      latitude,
      longitude
    } = req.body;

    const property = await Property.create({
      vendorId,
      title,
      propertyType,
      address,
      city,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      area,
      rentPrice: parseFloat(rentPrice),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
      amenities: amenities || [],
      description,
      images: images || [],
      status: 'Available',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    });

    return res.json({
      id: property.id,
      title: property.title,
      propertyType: property.propertyType,
      address: property.address,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      rentPrice: property.rentPrice,
      securityDeposit: property.securityDeposit,
      amenities: property.amenities,
      description: property.description,
      images: property.images,
      status: property.status,
      latitude: property.latitude,
      longitude: property.longitude,
      viewCount: 0,
      inquiryCount: 0,
      createdAt: property.createdAt
    });
  } catch (error) {
    console.error('Error creating property:', error);
    return res.status(500).json({ error: 'Failed to create property' });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const property = await Property.findOne({ where: { id, vendorId } });
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const {
      title,
      propertyType,
      address,
      city,
      bedrooms,
      bathrooms,
      area,
      rentPrice,
      securityDeposit,
      amenities,
      description,
      images,
      status,
      latitude,
      longitude
    } = req.body;

    await property.update({
      title: title || property.title,
      propertyType: propertyType || property.propertyType,
      address: address !== undefined ? address : property.address,
      city: city !== undefined ? city : property.city,
      bedrooms: bedrooms ? parseInt(bedrooms) : property.bedrooms,
      bathrooms: bathrooms ? parseInt(bathrooms) : property.bathrooms,
      area: area || property.area,
      rentPrice: rentPrice ? parseFloat(rentPrice) : property.rentPrice,
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : property.securityDeposit,
      amenities: amenities || property.amenities,
      description: description !== undefined ? description : property.description,
      images: images || property.images,
      status: status || property.status,
      latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : property.latitude,
      longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : property.longitude
    });

    return res.json({
      id: property.id,
      title: property.title,
      propertyType: property.propertyType,
      address: property.address,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      rentPrice: property.rentPrice,
      securityDeposit: property.securityDeposit,
      amenities: property.amenities,
      description: property.description,
      images: property.images,
      status: property.status,
      latitude: property.latitude,
      longitude: property.longitude,
      viewCount: property.viewCount,
      inquiryCount: property.inquiryCount,
      createdAt: property.createdAt
    });
  } catch (error) {
    console.error('Error updating property:', error);
    return res.status(500).json({ error: 'Failed to update property' });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const property = await Property.findOne({ where: { id, vendorId } });
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Check if property has active bookings
    const activeBooking = await Booking.findOne({
      where: {
        propertyId: id,
        status: 'Active'
      }
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete property with active booking'
      });
    }

    await property.destroy();

    return res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete property' });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vendorId = req.user.id;

    const booking = await Booking.findOne({
      where: { id, vendorId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await booking.update({ status });

    // If approved, update property status to Rented
    if (status === 'Approved' || status === 'Active') {
      await Property.update(
        { status: 'Rented' },
        { where: { id: booking.propertyId } }
      );
    }

    // If completed or cancelled, make property available again
    if (status === 'Completed' || status === 'Cancelled' || status === 'Rejected') {
      await Property.update(
        { status: 'Available' },
        { where: { id: booking.propertyId } }
      );
    }

    return res.json({
      success: true,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update booking status' });
  }
};

// Upload property images
exports.uploadPropertyImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No images uploaded' });
    }

    // Return just the filenames (e.g., 'property-1234567890.jpg')
    const filenames = req.files.map(file => file.filename);

    return res.json({
      success: true,
      images: filenames
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload images' });
  }
};

// Book a property (tenant/lessor action)
exports.bookProperty = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { propertyId, moveInDate, moveOutDate, message } = req.body;

    console.log('📝 Booking request received:', { tenantId, propertyId, moveInDate, moveOutDate, message });

    if (!propertyId || !moveInDate) {
      return res.status(400).json({ error: 'Property ID and move-in date are required' });
    }

    // Get property details
    const property = await Property.findOne({
      where: { id: propertyId, status: 'Available' },
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ]
    });

    if (!property) {
      console.log('❌ Property not found or not available:', propertyId);
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    // Get tenant info
    const tenant = await User.findByPk(tenantId, {
      attributes: ['id', 'fullName', 'email', 'phone']
    });

    if (!tenant) {
      console.log('❌ Tenant not found:', tenantId);
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Create booking
    const booking = await Booking.create({
      propertyId,
      tenantId,
      vendorId: property.vendorId,
      moveInDate,
      moveOutDate: moveOutDate || null,
      monthlyRent: property.rentPrice,
      status: 'Pending',
      message: message || ''
    });

    console.log('✅ Booking created successfully:', { 
      bookingId: booking.id, 
      tenantId, 
      propertyId, 
      status: booking.status 
    });

    // Send notification to property owner
    try {
      const { createUserNotification } = require('./notificationController');
      
      const moveInFormatted = new Date(moveInDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      const moveOutFormatted = moveOutDate 
        ? new Date(moveOutDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        : 'Not specified';

      const notificationTitle = `🏠 New Property Booking Request`;
      const notificationMessage = `${tenant.fullName} wants to rent your property "${property.title}" from ${moveInFormatted}${moveOutDate ? ` to ${moveOutFormatted}` : ''}. Monthly rent: NPR ${parseInt(property.rentPrice).toLocaleString()}`;

      // Create notification with booking metadata
      const notification = await Notification.create({
        userId: property.vendorId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'booking',
        isBroadcast: false,
        link: `/owner/bookings`,
        metadata: JSON.stringify({
          bookingId: booking.id,
          tenantName: tenant.fullName,
          tenantEmail: tenant.email,
          tenantPhone: tenant.phone,
          propertyTitle: property.title,
          moveInDate: moveInDate,
          moveOutDate: moveOutDate,
          monthlyRent: property.rentPrice,
          message: message,
          requiresAction: true
        })
      });

      // Emit real-time notification
      const { io, connectedUsers } = require('./notificationController').getSocketIO
        ? require('./notificationController').getSocketIO()
        : { io: null, connectedUsers: null };
      
      if (io && connectedUsers) {
        const socketId = connectedUsers.get(property.vendorId.toString());
        if (socketId) {
          io.to(socketId).emit('new-notification', {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            isRead: false,
            createdAt: notification.created_at,
            metadata: {
              bookingId: booking.id,
              tenantName: tenant.fullName,
              propertyTitle: property.title,
              moveInDate: moveInDate,
              requiresAction: true
            }
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    return res.json({
      success: true,
      message: 'Booking request sent successfully',
      booking: {
        id: booking.id,
        propertyTitle: property.title,
        moveInDate: booking.moveInDate,
        moveOutDate: booking.moveOutDate,
        monthlyRent: booking.monthlyRent,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('❌ Error booking property:', error);
    return res.status(500).json({ error: 'Failed to book property' });
  }
};

module.exports = exports;
