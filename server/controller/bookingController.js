const { Op } = require('sequelize');
const BookingApplication = require('../models/BookingApplication');
const Property = require('../models/Property');
const Bike = require('../models/Bike');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const BikeBooking = require('../models/BikeBooking');
const Payment = require('../models/Payment');
const sendEmail = require('../utils/mailer');
const getOwnerStats = require('../utils/ownerStats');

// Submit a booking application
exports.applyForBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId, listingType, startDate, endDate, duration, totalAmount } = req.body;
    console.log('Booking Application received:', { listingId, listingType, startDate, endDate, duration, totalAmount });

    if (!listingId) return res.status(400).json({ message: 'listingId is required' });
    if (!listingType) return res.status(400).json({ message: 'listingType is required' });
    if (!startDate) return res.status(400).json({ message: 'startDate is required' });
    if (!endDate) return res.status(400).json({ message: 'endDate is required' });
    if (!duration) return res.status(400).json({ message: 'duration is required' });
    if (totalAmount === undefined || totalAmount === null || isNaN(totalAmount)) {
      return res.status(400).json({ message: 'valid totalAmount is required' });
    }

    // Verify listing exists
    const Model = listingType === 'property' ? Property : Bike;
    const listing = await Model.findByPk(listingId);

    if (!listing || (listing.status && listing.status.toLowerCase() !== 'available')) {
      return res.status(400).json({
        message: 'Listing is not available',
        details: `Current status: ${listing?.status || 'Unknown'}`
      });
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
      const statusMsg = overlapping.status === 'paid' ? 'already booked and paid for' : 'already has a pending request for';
      return res.status(400).json({
        message: `This listing is ${statusMsg} the selected dates. Please try other dates.`
      });
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

    // Emit socket event for real-time count updates
    const io = req.app.get('io');
    if (io) {
      // Refresh count for applicant
      io.to(`user_${userId}`).emit('refresh_counts');
      // Refresh count for owner
      if (listing?.vendorId) {
        io.to(`user_${listing.vendorId}`).emit('refresh_counts');
      }
    }

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
          ...listing?.toJSON(), // Spread listing first so it doesn't overwrite app details
          id: app.id, // Ensure ID is application ID
          applicationId: app.id, // Explicit alias
          bookingId: app.id, // Another alias
          status: app.status,
          startDate: app.startDate,
          endDate: app.endDate,
          duration: app.duration,
          grandTotal: app.totalAmount,
          totalAmount: app.totalAmount,
          rejectionReason: app.rejectionReason,
          createdAt: app.createdAt,
          type: app.listingType,
          // If we need listing ID specifically, it's now lost if simply spreading listing first without caution?
          // Actually listing.id would overwrite nothing if we act carefully.
          // But listing has 'id'.
          // Let's explicitly preserve detailed listing info if needed.
          listingId: app.listingId,
          listingDetails: listing?.toJSON() // Better practice: nest it to avoid collisions entirely
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
    console.log('Update Application request:', { id, startDate, endDate, duration, totalAmount });

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
        { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'phone'] }
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

    // If owner is approving, ensure no overlapping approved/paid applications or active rentals exist
    if (status === 'approved') {
      // Check for overlapping applications (approved or paid) excluding current
      const overlappingApp = await BookingApplication.findOne({
        where: {
          listingId: application.listingId,
          listingType: application.listingType,
          status: { [Op.in]: ['approved', 'paid'] },
          id: { [Op.ne]: id },
          [Op.or]: [
            { startDate: { [Op.between]: [application.startDate, application.endDate] } },
            { endDate: { [Op.between]: [application.startDate, application.endDate] } },
            { [Op.and]: [{ startDate: { [Op.lte]: application.startDate } }, { endDate: { [Op.gte]: application.endDate } }] }
          ]
        }
      });

      if (overlappingApp) {
        return res.status(400).json({ message: 'Listing already has an approved or paid booking for the selected dates.' });
      }

      // Also check for existing active Booking/BikeBooking records that overlap
      if (application.listingType === 'property') {
        const activeBooking = await Booking.findOne({
          where: {
            propertyId: application.listingId,
            status: 'Active',
            [Op.or]: [
              { moveInDate: { [Op.between]: [application.startDate, application.endDate] } },
              { moveOutDate: { [Op.between]: [application.startDate, application.endDate] } },
              { [Op.and]: [{ moveInDate: { [Op.lte]: application.startDate } }, { moveOutDate: { [Op.gte]: application.endDate } }] }
            ]
          }
        });

        if (activeBooking) {
          return res.status(400).json({ message: 'Listing already has an active rental overlapping the selected dates.' });
        }
      } else {
        const activeBikeBooking = await BikeBooking.findOne({
          where: {
            bikeId: application.listingId,
            status: 'Active',
            [Op.or]: [
              { startDate: { [Op.between]: [application.startDate, application.endDate] } },
              { endDate: { [Op.between]: [application.startDate, application.endDate] } },
              { [Op.and]: [{ startDate: { [Op.lte]: application.startDate } }, { endDate: { [Op.gte]: application.endDate } }] }
            ]
          }
        });

        if (activeBikeBooking) {
          return res.status(400).json({ message: 'Listing already has an active rental overlapping the selected dates.' });
        }
      }
    }

    application.status = status;
    if (status === 'rejected' && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    await application.save();

    // If owner approved the application, mark the underlying listing as Rented
    if (status === 'approved' && listing) {
      try {
        listing.status = 'Rented';
        await listing.save();
      } catch (err) {
        console.error('Failed to mark listing as Rented:', err);
      }
    }

    // If owner approved, create the underlying rental record immediately so the listing
    // is considered rented (avoid duplicate creation if one already exists).
    if (status === 'approved' && listing) {
      try {
        if (application.listingType === 'property') {
          // Create Booking if not already present for same property/date/tenant
          const existingBooking = await Booking.findOne({
            where: {
              propertyId: listing.id,
              tenantId: application.userId,
              moveInDate: application.startDate
            }
          });

          if (!existingBooking) {
            await Booking.create({
              propertyId: listing.id,
              tenantId: application.userId,
              vendorId: listing.vendorId,
              moveInDate: application.startDate,
              moveOutDate: application.endDate,
              monthlyRent: application.totalAmount,
              status: 'Active',
              message: 'Created on owner approval'
            });
          }
        } else if (application.listingType === 'bike') {
          const existingBikeBooking = await BikeBooking.findOne({
            where: {
              bikeId: listing.id,
              lessorId: application.userId,
              startDate: application.startDate
            }
          });

          if (!existingBikeBooking) {
            await BikeBooking.create({
              lessorId: application.userId,
              vendorId: listing.vendorId,
              bikeId: listing.id,
              startDate: application.startDate,
              endDate: application.endDate,
              totalDays: application.duration,
              dailyRate: Number(application.totalAmount) / (application.duration || 1),
              totalAmount: application.totalAmount,
              securityDeposit: listing.securityDeposit || 0,
              status: 'Active',
              message: 'Created on owner approval'
            });
          }
        }
      } catch (createErr) {
        console.error('Failed to create rental on approval:', createErr);
      }
    }

    // Emit updated owner stats (rented counts) so frontend updates immediately
    try {
      const io = req.app.get('io');
      if (io && listing) {
        const vendorId = listing.vendorId;
        const stats = await getOwnerStats(vendorId);
        io.to(`user_${vendorId}`).emit('owner_stats_updated', stats);
      }
    } catch (emitErr) {
      console.error('Failed to emit owner_stats_updated:', emitErr);
    }

    // --- NOTIFICATION & EMAIL LOGIC ---
    try {
      const io = req.app.get('io');
      const listingTitle = listing.title || (listing.brand + ' ' + listing.model);
      const notifTitle = `Application ${status === 'approved' ? 'Approved' : 'Rejected'}`;
      const notifMessage = `Your application for "${listingTitle}" has been ${status}.${status === 'rejected' ? ` Reason: ${rejectionReason}` : ''}`;

      // 1. Create DB Notification
      const notification = await Notification.create({
        user_id: application.userId, // snake_case as per model
        title: notifTitle,
        message: notifMessage,
        type: status === 'approved' ? 'success' : 'error',
        is_read: false
      });

      // 2. Emit Socket Event
      if (io) {
        io.to(`user_${application.userId}`).emit('new-notification', notification);
        io.to(`user_${application.userId}`).emit('refresh_counts');
        io.to(`user_${vendorId}`).emit('refresh_counts');
      }

      // 3. Send Email
      const applicant = await User.findByPk(application.userId);
      if (applicant && applicant.email) {
        await sendEmail({
          to: applicant.email,
          subject: `RentHive - ${notifTitle}`,
          text: notifMessage,
          html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>${notifTitle}</h2>
                <p>Hello ${applicant.name},</p>
                <p>${notifMessage}</p>
                <p>Login to your <a href="http://localhost:5173/user/dashboard">dashboard</a> to view details.</p>
                <br/>
                <p>Best regards,<br/>RentHive Team</p>
              </div>
            `
        }).catch(err => console.error('Failed to send email:', err.message));
      }
    } catch (notifErr) {
      console.error('Notification failed:', notifErr);
      // Don't block the response
    }
    // ----------------------------------

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
    let paymentData = {
      tenantId: userId,
      amount: application.totalAmount,
      dueDate: application.startDate,
      paidDate: new Date(),
      status: 'Paid',
      paymentMethod: 'Khalti', // Defaulting to Khalti as per Modal
      transactionId: `RH-PAY-${Date.now()}`,
      notes: 'Initial payment for booking'
    };

    if (application.listingType === 'property') {
      const property = await Property.findByPk(application.listingId);
      if (!property) return res.status(404).json({ message: 'Property not found' });

      // Reuse existing booking created on approval if present
      rental = await Booking.findOne({
        where: {
          propertyId: property.id,
          tenantId: userId,
          moveInDate: application.startDate
        }
      });

      if (!rental) {
        rental = await Booking.create({
          propertyId: property.id,
          tenantId: userId,
          vendorId: property.vendorId,
          moveInDate: application.startDate,
          moveOutDate: application.endDate,
          monthlyRent: application.totalAmount,
          status: 'Active',
          message: 'Created from paid application'
        });
      }

      paymentData.bookingId = rental.id;
      paymentData.ownerId = property.vendorId;

      // Ensure property is marked as Rented after payment/rental creation
      try {
        property.status = 'Rented';
        await property.save();
      } catch (err) {
        console.error('Failed to mark property as Rented after payment:', err);
      }

    } else if (application.listingType === 'bike') {
      const bike = await Bike.findByPk(application.listingId);
      if (!bike) return res.status(404).json({ message: 'Bike not found' });

      // Reuse existing bike booking if created during approval
      rental = await BikeBooking.findOne({
        where: {
          bikeId: bike.id,
          lessorId: userId,
          startDate: application.startDate
        }
      });

      if (!rental) {
        rental = await BikeBooking.create({
          lessorId: userId,
          vendorId: bike.vendorId,
          bikeId: bike.id,
          startDate: application.startDate,
          endDate: application.endDate,
          totalDays: application.duration,
          dailyRate: Number(application.totalAmount) / application.duration,
          totalAmount: application.totalAmount,
          securityDeposit: bike.securityDeposit || 0,
          status: 'Active',
          message: 'Created from paid application'
        });
      }

      paymentData.bikeBookingId = rental.id;
      paymentData.ownerId = bike.vendorId;

      // Ensure bike is marked as Rented after payment/rental creation
      try {
        bike.status = 'Rented';
        await bike.save();
      } catch (err) {
        console.error('Failed to mark bike as Rented after payment:', err);
      }

    } else {
      return res.status(400).json({ message: 'Invalid listing type' });
    }

    // Create the Payment record
    const payment = await Payment.create(paymentData);

    // Link payment to application
    application.paymentId = payment.id;
    // Also link booking/payment if a booking record existed prior to payment
    if (rental && rental.id) {
      // No bookingId column on application model; we can store in payment bookingId fields already handled above
    }
    await application.save();

    // --- NOTIFICATION LOGIC (Payment Success) ---
    try {
      const io = req.app.get('io');
      const vendorId = paymentData.ownerId;

      // Get listing details for email
      const listingTitle = application.listingType === 'property'
        ? (await Property.findByPk(application.listingId))?.title
        : (await Bike.findByPk(application.listingId))?.name || `${(await Bike.findByPk(application.listingId))?.brand} ${(await Bike.findByPk(application.listingId))?.model}`;

      // Notify Owner
      const ownerNotifTitle = 'New Payment Received';
      const ownerNotifMessage = `You received Rs. ${application.totalAmount} from user #${userId}.`;

      const ownerNotif = await Notification.create({
        user_id: vendorId,
        title: ownerNotifTitle,
        message: ownerNotifMessage,
        type: 'success'
      });

      if (io) {
        io.to(`user_${vendorId}`).emit('new-notification', ownerNotif);
        io.to(`user_${vendorId}`).emit('refresh_counts');
      }

      // Notify Tenant (User)
      const userNotif = await Notification.create({
        user_id: userId,
        title: 'Payment Successful',
        message: `Your payment of Rs. ${application.totalAmount} was successful. Rental is now active!`,
        type: 'success'
      });

      if (io) {
        io.to(`user_${userId}`).emit('new-notification', userNotif);
        io.to(`user_${userId}`).emit('refresh_counts');
      }

      // Send Payment Confirmation Email to User
      const user = await User.findByPk(userId);
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: 'RentHive - Payment Confirmation',
          text: `Your payment of Rs. ${application.totalAmount} was successful. Your rental for "${listingTitle}" is now active!`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Payment Confirmed!</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #667eea;">Hello ${user.name},</h2>
                <p style="font-size: 16px; line-height: 1.6;">Your payment has been successfully processed!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Listing:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${listingTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">Rs. ${application.totalAmount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Transaction ID:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentData.transactionId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Start Date:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(application.startDate).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px;"><strong>End Date:</strong></td>
                      <td style="padding: 8px;">${new Date(application.endDate).toLocaleDateString()}</td>
                    </tr>
                  </table>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;">Your rental is now <strong>active</strong>! You can view all details in your dashboard.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:5173/user/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  If you have any questions, please contact us at support@renthive.com
                </p>
                
                <p style="font-size: 14px; color: #666;">
                  Best regards,<br/>
                  <strong>RentHive Team</strong>
                </p>
              </div>
            </div>
          `
        }).catch(err => console.error('Failed to send payment confirmation email:', err.message));
      }

    } catch (notifErr) {
      console.error('Payment notification error:', notifErr);
    }
    // --------------------------------------------

    res.json({ message: 'Payment successful, rental and payment record created', rental, payment });
  } catch (error) {
    console.error('Pay for application error:', error);
    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
};

module.exports = exports;

