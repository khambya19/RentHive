const Property = require('../models/Property');
const Booking = require('../models/Booking');
const PropertyView = require('../models/PropertyView');
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// Get all available properties for browsing (tenant/lessor)
exports.getAvailableProperties = async (req, res) => {
  try {
    const { 
      search, 
      city, 
      minPrice, 
      maxPrice, 
      type, 
      bedrooms, 
      bathrooms, 
      minArea, 
      maxArea, 
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = { status: 'Available' };

    // Property type filter
    if (type && type !== 'all') {
      whereClause.propertyType = type;
    }

    // City/Location filter
    if (city) {
      whereClause.city = { [Op.iLike || Op.like]: `%${city}%` };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.rentPrice = {};
      if (minPrice) whereClause.rentPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.rentPrice[Op.lte] = parseFloat(maxPrice);
    }

    // Bedrooms filter
    if (bedrooms) {
      whereClause.bedrooms = parseInt(bedrooms);
    }

    // Bathrooms filter
    if (bathrooms) {
      whereClause.bathrooms = parseInt(bathrooms);
    }

    // Area range filter
    if (minArea || maxArea) {
      whereClause.area = {};
      if (minArea) whereClause.area[Op.gte] = parseFloat(minArea);
      if (maxArea) whereClause.area[Op.lte] = parseFloat(maxArea);
    }

    // Amenities filter (check if property has all selected amenities)
    if (amenities) {
      const amenitiesList = amenities.split(',').map(a => a.trim());
      whereClause.amenities = {
        [Op.contains]: amenitiesList
      };
    }

    // Search by title, address, or city
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike || Op.like]: `%${search}%` } },
        { address: { [Op.iLike || Op.like]: `%${search}%` } },
        { city: { [Op.iLike || Op.like]: `%${search}%` } },
        { description: { [Op.iLike || Op.like]: `%${search}%` } }
      ];
    }

    // Determine sort order
    let orderClause = [];
    const validSortFields = ['createdAt', 'rentPrice', 'area', 'bedrooms', 'bathrooms', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      orderClause.push([sortBy, sortOrder.toUpperCase()]);
    } else {
      orderClause.push(['createdAt', 'DESC']);
    }

    const properties = await Property.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'name', 'email', 'phone', 'profileImage']
        }
      ],
      order: orderClause
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
      createdAt: p.createdAt,
      vendorId: p.vendorId,
      vendorName: p.vendor?.name,
      vendorEmail: p.vendor?.email,
      vendorPhone: p.vendor?.phone,
      vendorImage: p.vendor?.profileImage
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
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email', 'phone'] },
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
      latitude,
      longitude
    } = req.body;

    // Process uploaded image files
    const imagePaths = req.files ? req.files.map(file => file.filename) : [];

    // Parse amenities if it's a JSON string
    const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || []);

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
      amenities: parsedAmenities,
      description,
      images: imagePaths,
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
      status,
      latitude,
      longitude
    } = req.body;

    // Process uploaded image files if any
    let imagePaths = property.images;
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => file.filename);
    }

    // Parse amenities if it's a JSON string
    const parsedAmenities = amenities && typeof amenities === 'string' ? JSON.parse(amenities) : (amenities || property.amenities);

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
      amenities: parsedAmenities,
      description: description !== undefined ? description : property.description,
      images: imagePaths,
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

    // Send notification to tenant about status change
    const property = await Property.findByPk(booking.propertyId);
    const { io, connectedUsers } = require('../server');
    
    let notificationTitle = '';
    let notificationMessage = '';
    
    if (status === 'Approved') {
      notificationTitle = '✅ Booking Approved!';
      notificationMessage = `Your booking request for "${property.title}" has been approved!`;
    } else if (status === 'Rejected') {
      notificationTitle = '❌ Booking Rejected';
      notificationMessage = `Your booking request for "${property.title}" has been rejected.`;
    } else if (status === 'Completed') {
      notificationTitle = '🎉 Tenancy Completed';
      notificationMessage = `Your tenancy for "${property.title}" has been marked as completed.`;
    } else if (status === 'Cancelled') {
      notificationTitle = '🚫 Booking Cancelled';
      notificationMessage = `Your booking for "${property.title}" has been cancelled.`;
    }
    
    if (notificationTitle) {
      try {
        const notification = await Notification.create({
          userId: booking.tenantId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'info',
          isBroadcast: false,
          link: `/tenant/dashboard?tab=applications`
        });

        console.log(`📧 STATUS UPDATE (${status}): Sending notification to TENANT (tenantId: ${booking.tenantId})`);
        console.log(`   Owner ID who ${status.toLowerCase()}: ${vendorId}`);
        console.log(`   This notification should ONLY go to tenant, NOT owner`);
        
        if (io && connectedUsers) {
          const socketId = connectedUsers.get(booking.tenantId.toString());
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
            console.log(`✅ Booking status notification sent to tenant ${booking.tenantId}`);
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
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
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!property) {
      console.log('❌ Property not found or not available:', propertyId);
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    // Get tenant info
    const tenant = await User.findByPk(tenantId, {
      attributes: ['id', 'name', 'email', 'phone']
    });

    if (!tenant) {
      console.log('❌ Tenant not found:', tenantId);
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Prevent self-booking
    if (property.vendorId === tenantId) {
      return res.status(400).json({ error: 'You cannot book your own property' });
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
      const { io, connectedUsers } = require('../server');
      
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

      const notificationTitle = '🏠 New Property Booking Request';
      const notificationMessage = `${tenant.name} wants to rent your property "${property.title}" from ${moveInFormatted}${moveOutDate ? ` to ${moveOutFormatted}` : ''}. Monthly rent: NPR ${parseInt(property.rentPrice).toLocaleString()}`;

      // Create notification
      const notification = await Notification.create({
        userId: property.vendorId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'info',
        isBroadcast: false,
        link: `/owner/dashboard?tab=bookings`
      });

      console.log('✅ Notification created:', notification.id);
      console.log(`📧 BOOKING REQUEST: Sending notification to OWNER (vendorId: ${property.vendorId})`);
      console.log(`   Tenant ID who booked: ${tenantId}`);
      console.log(`   This notification should ONLY go to owner, NOT tenant`);

      // Emit real-time notification
      if (io && connectedUsers) {
        const socketId = connectedUsers.get(property.vendorId.toString());
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
          console.log(`✅ Booking request notification sent to owner ${property.vendorId}`);
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
