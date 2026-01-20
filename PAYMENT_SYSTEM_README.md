# Rent Payment Reminder System

## Overview
A comprehensive automated rent payment reminder system for RentHive that tracks rent payments, sends automated reminders, and manages overdue notifications.

## Features

### 1. Automated Payment Creation
- **When**: Runs daily at midnight (00:00)
- **What**: Creates monthly payment records for all active bookings on the 1st of each month
- **Details**: 
  - Automatically calculates rent amount from booking details
  - Sets due date to the 5th of the month
  - Creates payment records for both tenants and property owners
  - Skips if payment already exists for the month

### 2. Upcoming Payment Reminders
- **When**: Runs twice daily at 8:00 AM and 4:00 PM
- **What**: Sends reminders 3 days before payment due date
- **How**:
  - Email notification to tenant
  - In-app notification via Socket.IO
  - Tracks reminder count and last reminder date
  - Only sends if reminder hasn't been sent yet

### 3. Overdue Payment Checks
- **When**: Runs daily at midnight (00:00)
- **What**: Marks payments as overdue and sends urgent notifications
- **How**:
  - Changes payment status from "Pending" to "Overdue"
  - Sends urgent email notifications
  - Creates in-app notifications for both tenant and owner
  - Continues sending reminders for overdue payments

## Database Schema

### Payment Model
```javascript
{
  id: INTEGER (Primary Key),
  bookingId: INTEGER (Foreign Key → Booking),
  tenantId: INTEGER (Foreign Key → User),
  ownerId: INTEGER (Foreign Key → User),
  amount: DECIMAL(10, 2),
  dueDate: DATE,
  paidDate: DATE (nullable),
  status: ENUM('Pending', 'Paid', 'Overdue', 'Cancelled'),
  paymentMethod: STRING (nullable) - e.g., 'Cash', 'Bank Transfer', 'Online Payment'
  transactionId: STRING (nullable),
  reminderSent: BOOLEAN,
  reminderCount: INTEGER,
  lastReminderDate: DATE (nullable),
  notes: TEXT (nullable),
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP
}
```

## API Endpoints

### Tenant Endpoints
- `GET /api/payments/tenant` - Get all payments for logged-in tenant
  - Returns: List of payments with property and owner details
  - Auth: Required (JWT token)

- `PATCH /api/payments/:paymentId/mark-paid` - Mark payment as paid
  - Body: `{ paymentMethod, transactionId, notes }`
  - Auth: Required (both tenants and owners can mark as paid)

### Owner Endpoints
- `GET /api/payments/owner` - Get all payments for owner's properties
  - Returns: List of payments with property and tenant details
  - Auth: Required (JWT token)

- `GET /api/payments/owner/stats` - Get payment statistics
  - Returns:
    ```javascript
    {
      totalPending: DECIMAL,
      totalOverdue: DECIMAL,
      totalCollected: DECIMAL,
      overdueCount: INTEGER
    }
    ```
  - Auth: Required (owner/vendor only)

- `POST /api/payments/` - Manually create a payment record
  - Body: `{ bookingId, amount, dueDate }`
  - Auth: Required (owner/vendor only)

### Test Endpoints (Development Only)
- `POST /api/test/create-monthly` - Manually trigger monthly payment creation
- `POST /api/test/send-reminders` - Manually trigger reminder emails
- `POST /api/test/check-overdue` - Manually trigger overdue checks

## Frontend Components

### PaymentManagement Component
Located: `client/src/components/PaymentManagement.jsx`

**Features:**
- View all payments with filtering (All, Pending, Overdue, Paid)
- Payment statistics dashboard (for owners)
- Mark payments as paid with payment details
- Display payment history
- Real-time updates via Socket.IO

**Usage:**
```jsx
import PaymentManagement from '../components/PaymentManagement';

// In UserDashboard (Tenant view)
{activeTab === 'payments' && <PaymentManagement />}

// In OwnerDashboard (Owner view)
{activeTab === 'payments' && <PaymentManagement />}
```

## Configuration

### Environment Variables
Add to `server/.env`:
```env
# Payment Reminder Settings
PAYMENT_REMINDER_DAYS_BEFORE=3
PAYMENT_OVERDUE_CHECK_ENABLED=true

# Email Configuration (required for reminders)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Scheduler Configuration
Located: `server/services/paymentScheduler.js`

Current schedule:
- **Daily midnight**: `schedule.scheduleJob('0 0 * * *', createMonthlyPayments)`
- **8 AM & 4 PM**: `schedule.scheduleJob('0 8,16 * * *', sendUpcomingPaymentReminders)`

To modify:
```javascript
// Cron format: 'second minute hour day month dayOfWeek'
// Examples:
// '0 0 * * *'      - Every day at midnight
// '0 8,16 * * *'   - Every day at 8 AM and 4 PM
// '0 */6 * * *'    - Every 6 hours
```

## Testing the System

### 1. Manual Testing via API
```bash
# Create monthly payments
curl -X POST http://localhost:5001/api/test/create-monthly

# Send reminders
curl -X POST http://localhost:5001/api/test/send-reminders

# Check overdue
curl -X POST http://localhost:5001/api/test/check-overdue
```

### 2. Verify Database
Check the `Payments` table in PostgreSQL:
```sql
SELECT * FROM "Payments" ORDER BY "createdAt" DESC;
```

### 3. Check Console Logs
The server logs show scheduler activity:
```
✅ Payment scheduler initialized
📧 Monthly payments created for X bookings
📧 Sent X payment reminders
⚠️ Marked X payments as overdue
```

## Email Templates

### Upcoming Payment Reminder
- **Subject**: "Rent Payment Reminder - Due in 3 Days"
- **Content**: Property details, amount, due date, payment instructions

### Overdue Payment Notice
- **Subject**: "Urgent: Rent Payment Overdue"
- **Content**: Payment details, overdue status, late fee information

## Notification System Integration

### Socket.IO Events
- **Event**: `new-notification`
- **Payload**:
  ```javascript
  {
    type: 'payment_reminder' | 'payment_overdue',
    title: String,
    message: String,
    userId: Integer,
    relatedId: Integer (Payment ID),
    createdAt: Timestamp
  }
  ```

### In-App Notifications
- Stored in `Notifications` table
- Displayed in dashboard notification bell
- Real-time delivery via Socket.IO

## Workflow

### Monthly Payment Creation (1st of Month)
1. Scheduler runs at midnight
2. Fetches all active bookings
3. Checks if payment exists for current month
4. Creates payment record if not exists
5. Sets status to "Pending"
6. Logs activity

### Reminder Process (3 Days Before Due)
1. Scheduler runs at 8 AM and 4 PM
2. Finds payments due in 3 days
3. Checks if reminder already sent
4. Sends email to tenant
5. Creates in-app notification
6. Updates `reminderSent` and `reminderCount`

### Overdue Detection (After Due Date)
1. Scheduler runs at midnight
2. Finds pending payments past due date
3. Updates status to "Overdue"
4. Sends urgent email to tenant
5. Notifies owner of overdue payment
6. Continues reminder emails until paid

### Payment Completion
1. Tenant/Owner marks payment as paid in UI
2. API updates payment record:
   - `status` → "Paid"
   - `paidDate` → Current date
   - `paymentMethod`, `transactionId`, `notes` saved
3. Notifications sent confirming payment

## Security Considerations

1. **Authentication**: All endpoints require JWT token
2. **Authorization**: Users can only access their own payments
3. **Data Validation**: Input validated on server side
4. **SQL Injection**: Protected by Sequelize ORM
5. **XSS Protection**: Data sanitized before rendering

## Production Deployment

### Before Going Live:
1. **Update Email Credentials**: Replace with production SMTP server
2. **Remove Test Endpoints**: Delete `/api/test/*` routes
3. **Add Admin Protection**: Secure scheduler trigger endpoints
4. **Configure Logging**: Use production logging service
5. **Set Up Monitoring**: Alert for failed scheduler jobs
6. **Database Backups**: Ensure payment data is backed up
7. **SSL/TLS**: Use HTTPS for all API calls

### Recommended Monitoring:
- Track scheduler job success/failure rates
- Monitor email delivery rates
- Alert on database errors
- Log payment status transitions

## Troubleshooting

### Scheduler Not Running
```javascript
// Check server logs for:
✅ Payment scheduler initialized

// Verify node-schedule is installed:
npm list node-schedule
```

### Emails Not Sending
```javascript
// Check EMAIL_USER and EMAIL_PASS in .env
// For Gmail, use App Password (not regular password)
// Enable "Less secure app access" or use OAuth2
```

### Payments Not Created
```javascript
// Check for active bookings:
SELECT * FROM "Bookings" WHERE status = 'active';

// Verify Payment model associations:
// Booking → hasMany Payment
// Payment → belongsTo Booking, User (tenant), User (owner)
```

### Database Migration
If Payment table doesn't exist:
```javascript
// Server automatically syncs on start
// Check console for: DB synced

// Manual sync:
const Payment = require('./models/Payment');
await Payment.sync({ force: true }); // WARNING: Drops existing table
```

## Future Enhancements

### Planned Features:
1. **Late Fee Calculation**: Automatically add late fees after X days
2. **Payment Plans**: Support for split payments
3. **Auto-Pay Integration**: Stripe/PayPal recurring billing
4. **SMS Reminders**: Send SMS for critical reminders
5. **Payment History Export**: Download PDF statements
6. **Multi-Currency**: Support for different currencies
7. **Payment Analytics**: Charts and trends for owners
8. **Tenant Credit Score**: Track payment history

## Support

For issues or questions:
- Check server console logs
- Review database records
- Test with manual API endpoints
- Verify environment variables
- Check email server configuration

## Version History

### v1.0.0 (2026-01-18)
- Initial implementation
- Automated monthly payment creation
- Email and in-app reminders
- Overdue payment detection
- Frontend payment management UI
- Test endpoints for development
