const { Op } = require('sequelize');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/mailer');

// Create monthly payment records for active bookings
const createMonthlyPayments = async () => {
  try {
    console.log('🔄 Creating monthly payment records...');
    
    const activeBookings = await Booking.findAll({
      where: { 
        status: 'Active',
        moveOutDate: {
          [Op.or]: [
            { [Op.gte]: new Date() },
            { [Op.is]: null }
          ]
        }
      },
      include: [
        { model: User, as: 'tenant' },
        { model: User, as: 'vendor' }
      ]
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Set due date to the 1st of next month
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);

    for (const booking of activeBookings) {
      // Check if payment already exists for next month
      const existingPayment = await Payment.findOne({
        where: {
          bookingId: booking.id,
          dueDate: nextMonth
        }
      });

      if (!existingPayment) {
        await Payment.create({
          bookingId: booking.id,
          tenantId: booking.tenantId,
          ownerId: booking.vendorId,
          amount: booking.monthlyRent,
          dueDate: nextMonth,
          status: 'Pending'
        });
        
        console.log(`✅ Created payment for booking ${booking.id}, due: ${nextMonth}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating monthly payments:', error);
  }
};

// Send reminders for upcoming payments (3 days before due)
const sendUpcomingPaymentReminders = async () => {
  try {
    console.log('📧 Checking for upcoming payment reminders...');
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const upcomingPayments = await Payment.findAll({
      where: {
        status: 'Pending',
        dueDate: threeDaysFromNow.toISOString().split('T')[0],
        reminderSent: false
      },
      include: [
        { model: User, as: 'tenant' },
        { model: User, as: 'owner' },
        { model: Booking, include: ['property'] }
      ]
    });

    for (const payment of upcomingPayments) {
      const tenant = payment.tenant;
      const property = payment.Booking?.property;
      
      // Send email reminder
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Reminder - RentHive</h2>
          <p>Dear ${tenant.fullName},</p>
          <p>This is a friendly reminder that your rent payment is due in 3 days.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Property:</strong> ${property?.title || 'N/A'}</p>
            <p><strong>Amount Due:</strong> Rs. ${payment.amount}</p>
            <p><strong>Due Date:</strong> ${payment.dueDate}</p>
          </div>
          <p>Please ensure timely payment to avoid any inconvenience.</p>
          <p>Thank you for being a valued tenant!</p>
          <p>Best regards,<br>RentHive Team</p>
        </div>
      `;
      
      try {
        await sendEmail({
          to: tenant.email,
          subject: '🔔 Rent Payment Reminder - Due in 3 Days',
          html: emailHtml
        });
        
        // Create in-app notification
        await Notification.create({
          userId: tenant.id,
          type: 'payment_reminder',
          title: 'Rent Payment Due Soon',
          message: `Your rent payment of Rs. ${payment.amount} is due on ${payment.dueDate}`,
          read: false
        });
        
        // Update payment record
        payment.reminderSent = true;
        payment.reminderCount += 1;
        payment.lastReminderDate = new Date();
        await payment.save();
        
        console.log(`✅ Reminder sent to ${tenant.email}`);
      } catch (emailError) {
        console.error(`❌ Failed to send reminder to ${tenant.email}:`, emailError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error sending payment reminders:', error);
  }
};

// Check for overdue payments and send notifications
const checkOverduePayments = async () => {
  try {
    console.log('⚠️  Checking for overdue payments...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const overduePayments = await Payment.findAll({
      where: {
        status: 'Pending',
        dueDate: { [Op.lt]: today }
      },
      include: [
        { model: User, as: 'tenant' },
        { model: User, as: 'owner' }
      ]
    });

    for (const payment of overduePayments) {
      // Update status to overdue
      if (payment.status === 'Pending') {
        payment.status = 'Overdue';
        await payment.save();
        
        const tenant = payment.tenant;
        const daysOverdue = Math.floor((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24));
        
        // Send overdue notification
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Overdue Payment Notice</h2>
            <p>Dear ${tenant.fullName},</p>
            <p>Your rent payment is now <strong style="color: #d32f2f;">${daysOverdue} day(s) overdue</strong>.</p>
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
              <p><strong>Amount Due:</strong> Rs. ${payment.amount}</p>
              <p><strong>Due Date:</strong> ${payment.dueDate}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
            </div>
            <p>Please make the payment immediately to avoid any penalties or lease termination.</p>
            <p>If you have already made the payment, please ignore this notice.</p>
            <p>Best regards,<br>RentHive Team</p>
          </div>
        `;
        
        try {
          await sendEmail({
            to: tenant.email,
            subject: '🚨 OVERDUE: Rent Payment Required',
            html: emailHtml
          });
          
          // Create urgent notification
          await Notification.create({
            userId: tenant.id,
            type: 'payment_overdue',
            title: 'Payment Overdue!',
            message: `Your rent payment of Rs. ${payment.amount} is ${daysOverdue} day(s) overdue. Please pay immediately.`,
            read: false
          });
          
          console.log(`✅ Overdue notice sent to ${tenant.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send overdue notice to ${tenant.email}:`, emailError.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking overdue payments:', error);
  }
};

module.exports = {
  createMonthlyPayments,
  sendUpcomingPaymentReminders,
  checkOverduePayments
};
