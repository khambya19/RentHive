# RentHive Authentication Setup

## ✅ Connected Features

### Frontend Routes
- **/** - Home/Landing Page
- **/login** - User Login
- **/register** - User Registration  
- **/forgot-password** - Password Recovery

### Backend API Endpoints
- **POST /api/auth/login** - User login
- **POST /api/auth/register** - User registration
- **POST /api/auth/forgot-password** - Password reset request

## 🚀 Setup Instructions

### 1. Database Setup
Run the migration to create the users table:
```bash
cd Database/migrations
psql -U your_username -d your_database -f 001_create_users_table.sql
```

Or using your database client, execute the SQL in `001_create_users_table.sql`

### 2. Install Dependencies

**Client:**
```bash
cd client
npm install
```

**Server:**
```bash
cd server
npm install
```

### 3. Environment Variables
Ensure your `.env` file has:
```env
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_secret_key_here
PORT=5000
```

### 4. Start the Application

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

## 🔄 User Flow

### Registration
1. User navigates to `/register`
2. Fills out registration form
3. Password is hashed with bcrypt
4. User data saved to database
5. JWT token generated and returned
6. User redirected to `/login`

### Login
1. User navigates to `/login`
2. Enters email and password
3. Password verified against hashed version
4. JWT token generated and stored in localStorage
5. User redirected to home page `/`

### Navigation
- Login page has "Sign up" link to register
- Register page has "Login" link to login
- Login page has "Forgot Password" link

## 📝 API Request Examples

### Register
```javascript
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John",
  "lastName": "Doe",
  "phone": "+977 9800000000",
  "address": "Kathmandu, Nepal",
  "citizenshipNumber": "12345"
}
```

### Login
```javascript
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

## 🔒 Security Features
- Passwords hashed using bcrypt (10 salt rounds)
- JWT tokens for authentication
- Token stored in localStorage
- 1-hour token expiration
- SQL injection protection via parameterized queries

## 📁 Key Files Modified
- ✅ `client/src/App.jsx` - Added routes
- ✅ `client/src/pages/Login/Login.jsx` - Connected to API
- ✅ `client/src/components/LessorRegistrationFormFixed.jsx` - Connected to API
- ✅ `server/controller/authController.js` - Implemented registration
- ✅ `server/models/User.js` - Created User model with pg pool
- ✅ `server/routes/auth.js` - Auth routes configured
- ✅ `Database/migrations/001_create_users_table.sql` - Database schema
