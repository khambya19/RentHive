# 💳 RentHive Payment Reminder System - User Guide

## Overview
The Payment Reminder System automates rent collection with scheduled reminders, payment tracking, and an intuitive dashboard.

---

## ✨ Key Features

### 1. **Automated Payment Reminders**
- 📧 Email reminders sent 3 days before due date
- ⏰ Daily checks for overdue payments
- 🔔 In-app notifications for payment updates

### 2. **Smart Payment Dashboard**
- **For Owners/Vendors:**
  - View all incoming rent payments
  - Track pending and overdue amounts
  - See monthly collection totals
  - Filter payments by status

- **For Tenants/Renters:**
  - View upcoming rent payments
  - See payment history
  - Mark payments as paid
  - Track overdue payments

### 3. **Payment Tracking**
- Real-time payment status (Pending/Paid/Overdue)
- Visual urgency indicators
  - 🟢 Normal: More than 7 days until due
  - 🟡 Warning: 3-7 days until due
  - 🟠 Urgent: Less than 3 days until due
  - 🔴 Overdue: Past due date

---

## 🚀 How It Works

### For Property Owners

1. **Booking Approval**
   - When you approve a booking, the system automatically creates monthly payment records
   - Payments are scheduled based on the move-in date

2. **Automatic Reminders**
   - **Midnight (12:00 AM):** Creates next month's payments
   - **8:00 AM & 4:00 PM:** Sends reminder emails to tenants
   - **Daily:** Checks for overdue payments and updates status

3. **Payment Management**
   - View dashboard: `/owner-dashboard`
   - Check "Payments" tab
   - See statistics: Total Pending, Overdue, Monthly Collection
   - Mark payments as received when tenant pays

### For Tenants

1. **View Payments**
   - Go to User Dashboard → Payments
   - See all upcoming rent payments
   - View payment history

2. **Make Payment**
   - Click "Mark as Paid" on a payment
   - Select payment method (Cash/Bank Transfer/Online/Cheque)
   - Enter transaction ID (optional)
   - Add notes if needed
   - Submit

3. **Get Reminders**
   - Receive email 3 days before due date
   - Check in-app notifications
   - View urgency indicators on payment cards

---

## 📋 Payment Status Guide

| Status | Description | Color |
|--------|-------------|-------|
| **Pending** | Payment not yet made, within due date | 🟡 Orange |
| **Paid** | Payment completed successfully | 🟢 Green |
| **Overdue** | Payment past due date | 🔴 Red |
| **Cancelled** | Payment cancelled | ⚫ Grey |

---

## 🎨 Dashboard Features

### Statistics Cards (Owner View)
```
⏳ Pending Payments     ⚠️ Overdue           ✅ Collected This Month
Rs. 45,000              Rs. 15,000           Rs. 120,000
                        (3 payments)
```

### Filter Options
- 📋 **All** - View all payments
- ⏳ **Pending** - Only pending payments
- ⚠️ **Overdue** - Only overdue payments
- ✅ **Paid** - Completed payments

### Payment Card Information
Each payment card shows:
- Property name and address
- Amount due
- Due date
- Days until/past due
- Tenant/Owner information
- Payment method (when paid)
- Transaction ID (when available)
- Notes

---

## 📧 Email Reminders

Tenants receive automatic emails:

**3 Days Before Due Date:**
```
Subject: Reminder: Rent Payment Due Soon

Dear [Tenant Name],

This is a friendly reminder that your rent payment of Rs. [Amount]
for [Property Title] is due on [Due Date].

Please make the payment on time to avoid late fees.

Thank you!
RentHive Team
```

**Overdue Notification:**
```
Subject: Urgent: Overdue Rent Payment

Dear [Tenant Name],

Your rent payment of Rs. [Amount] for [Property Title] was due on 
[Due Date] and is now overdue.

Please make the payment as soon as possible.

Thank you!
RentHive Team
```

---

## ⚙️ System Configuration

Current settings (configured in `.env`):
```
PAYMENT_REMINDER_DAYS_BEFORE=3
PAYMENT_OVERDUE_CHECK_ENABLED=true
```

### Scheduler Jobs

1. **Create Monthly Payments**
   - Runs: Every day at midnight (12:00 AM)
   - Action: Creates payment records for next month
   - Target: Active bookings only

2. **Send Reminders**
   - Runs: Daily at 8:00 AM and 4:00 PM
   - Action: Emails tenants 3 days before due date
   - Tracks: Reminder count, last reminder date

3. **Check Overdue**
   - Runs: Every day at midnight
   - Action: Updates status to "Overdue"
   - Sends: Urgent notification emails

---

## 🔧 API Endpoints

### For Tenants
- `GET /api/payments/tenant` - Get all tenant payments
- `PATCH /api/payments/:id/mark-paid` - Mark payment as paid

### For Owners
- `GET /api/payments/owner` - Get all owner payments
- `GET /api/payments/owner/stats` - Get payment statistics
- `POST /api/payments` - Create manual payment entry

### Query Parameters
```
?status=pending     - Filter by status
?startDate=YYYY-MM-DD  - Start date range
?endDate=YYYY-MM-DD    - End date range
```

---

## 💡 Best Practices

### For Owners
1. ✅ Approve bookings promptly to set up payment tracking
2. ✅ Check payment dashboard regularly
3. ✅ Mark payments as received when tenant pays
4. ✅ Add notes for record-keeping
5. ✅ Monitor overdue payments

### For Tenants
1. ✅ Check payment dashboard before due date
2. ✅ Enable email notifications
3. ✅ Mark payments after making them
4. ✅ Include transaction ID for bank transfers
5. ✅ Contact owner if payment issues arise

---

## 🎯 Quick Actions

### Mark Payment as Paid
1. Click "Mark as Paid" button on payment card
2. Modal appears with payment form
3. Select payment method from dropdown
4. Enter transaction ID (optional but recommended)
5. Add notes if needed
6. Click "Submit"
7. ✅ Notification: "Payment marked as paid successfully!"

### View Payment History
1. Use filter buttons at top
2. Click "Paid" to see completed payments
3. View payment details including:
   - Payment method
   - Transaction ID
   - Date paid
   - Notes

---

## 🚨 Troubleshooting

### Not Receiving Emails?
- Check spam/junk folder
- Verify email in profile settings
- Contact administrator

### Payment Not Showing?
- Refresh the page
- Check filter selection (All/Pending/Overdue/Paid)
- Verify booking is approved

### Can't Mark as Paid?
- Ensure you select a payment method
- Check internet connection
- Verify you're logged in

---

## 📊 Database Structure

Payment table includes:
- `booking_id` - Link to rental booking
- `tenant_id` - Tenant user ID
- `owner_id` - Owner/vendor user ID
- `amount` - Rent amount
- `due_date` - Payment due date
- `paid_date` - When payment was made
- `status` - Payment status
- `payment_method` - How payment was made
- `transaction_id` - Transaction reference
- `reminder_sent` - Email sent flag
- `reminder_count` - Number of reminders sent
- `last_reminder_date` - Last reminder timestamp
- `notes` - Additional information

---

## 🎨 UI/UX Improvements

### Modern Design
- ✅ Gradient stat cards with icons
- ✅ Color-coded urgency indicators
- ✅ Smooth animations and transitions
- ✅ Responsive mobile design
- ✅ Toast notifications for feedback

### User-Friendly Features
- ✅ Visual payment status badges
- ✅ "Days until due" indicators
- ✅ Empty state messages
- ✅ Filter badges with counts
- ✅ Modal forms for payments

---

## 📱 Mobile Responsive

The payment dashboard is fully responsive:
- Single column layout on mobile
- Touch-friendly buttons
- Readable fonts
- Optimized spacing

---

## 🔐 Security

- ✅ Authentication required for all endpoints
- ✅ Users can only access their own payments
- ✅ Secure payment data handling
- ✅ Transaction ID privacy

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Contact property owner/tenant
3. Reach out to RentHive support

---

**Last Updated:** January 19, 2026
**Version:** 2.0 - Enhanced UI/UX Release
