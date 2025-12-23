# RentHive Project Setup & Structure

## Project Overview
RentHive is a rental property management platform with vendor and user registration capabilities.

**Created:** December 16, 2025  
**Status:** ✅ Fully Configured & Running

---

## Directory Structure

```
RentHive/
├── server/                    # Backend API (Express.js)
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection pool
│   │   └── upload.js         # Multer file upload configuration
│   ├── controller/
│   │   └── authController.js # Auth logic (login, register, forgot password)
│   ├── models/
│   │   ├── User.js           # User model for lessor/vendor users
│   │   └── Vendor.js         # Vendor model (legacy, keeping for reference)
│   ├── routes/
│   │   ├── auth.js           # Auth routes (/api/auth/*)
│   │   └── userRoutes.js     # User routes (/api/users/*)
│   ├── uploads/
│   │   └── profiles/         # Vendor profile photos
│   ├── scripts/
│   │   └── checkAndFixDatabase.js
│   ├── middleware/           # Custom middleware (placeholder)
│   ├── utils/                # Utility functions (placeholder)
│   ├── server.js             # Main server entry point
│   ├── setup.js              # Setup script
│   ├── package.json          # Server dependencies
│   └── .env                  # Environment variables
│
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── LessorRegistrationFormFixed.jsx
│   │   │   └── VendorRegistrationFormFixed.jsx
│   │   ├── pages/
│   │   │   ├── Register.jsx
│   │   │   ├── Login/
│   │   │   └── ForgotPassword/
│   │   ├── LandingPage/      # Landing page components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── vite.config.js
│   ├── package.json
│   └── tailwind.client.js
│
├── Database/                 # Database migrations & seeds
│   ├── migrations/
│   │   ├── 001_create_users_table.sql
│   │   └── 002_create_vendors_table.sql
│   ├── seeds/               # Seed data (placeholder)
│   ├── runMigration.js      # Migration runner
│   └── setup.js
│
├── .env                     # Root environment variables
├── package.json             # Root package.json
└── TODO.md                  # Task tracking
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  citizenship_number VARCHAR(50),
  profile_photo VARCHAR(255),
  business_name VARCHAR(255),
  ownership_type VARCHAR(50),
  role VARCHAR(50) DEFAULT 'lessor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Vendors Table
```sql
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  business_name VARCHAR(255),
  ownership_type VARCHAR(50) DEFAULT 'Individual',
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Configuration

### Server (.env)
```env
PGDATABASE=renthive_db
PGUSER=postgres
PGPASSWORD=viscabarca
PGHOST=localhost
PGPORT=5432
JWT_SECRET=your_jwt_secret_key_here_replace_with_actual_secret
PORT=5000
NODE_ENV=development
```

---

## API Endpoints

### Authentication Routes (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | User registration |
| POST | `/register-vendor` | Vendor registration with photo |
| POST | `/login` | User login |
| POST | `/forgot-password` | Request password reset |

### User Routes (`/api/users/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all users |
| POST | `/register` | Register new user with photo |

### Test Route
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/test` | Test database connection |
| GET | `/` | Welcome message |

---

## Running the Application

### Prerequisites
- Node.js v18+
- PostgreSQL 12+
- npm or yarn

### Installation & Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   cd ../client
   npm install
   ```

2. **Create Database**
   ```bash
   cd server
   node -e "const { Client } = require('pg'); require('dotenv').config(); const client = new Client({user: process.env.PGUSER, host: process.env.PGHOST, password: process.env.PGPASSWORD, port: parseInt(process.env.PGPORT), database: 'postgres'}); client.connect().then(() => client.query('DROP DATABASE IF EXISTS renthive_db')).then(() => client.query('CREATE DATABASE renthive_db')).then(() => {console.log('Database created'); client.end();}).catch(err => {console.error(err); client.end();});"
   ```

3. **Run Migrations**
   ```bash
   cd server
   node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({user: process.env.PGUSER, host: process.env.PGHOST, database: process.env.PGDATABASE, password: process.env.PGPASSWORD, port: parseInt(process.env.PGPORT)}); const fs = require('fs'); const sql1 = fs.readFileSync('../Database/migrations/001_create_users_table.sql', 'utf8'); const sql2 = fs.readFileSync('../Database/migrations/002_create_vendors_table.sql', 'utf8'); pool.query(sql1).then(() => pool.query(sql2)).then(() => {console.log('Migrations complete'); pool.end();}).catch(err => {console.error(err); pool.end();});"
   ```

4. **Start Server**
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:5000
   ```

5. **Start Client** (in new terminal)
   ```bash
   cd client
   npm start
   # Client runs on http://localhost:3000
   ```

---

## Current Features ✅

- ✅ User registration (lessor)
- ✅ Vendor registration with photo upload
- ✅ User login with JWT token
- ✅ Password reset flow
- ✅ Database connection & migration
- ✅ File upload to `/uploads/profiles/`
- ✅ CORS enabled for cross-origin requests
- ✅ Password hashing with bcrypt

---

## Planned Features (TODO)

- [ ] Property listing CRUD
- [ ] Booking management
- [ ] Payment integration
- [ ] User profile management
- [ ] Property search & filter
- [ ] Email notifications
- [ ] Admin panel

---

## Technology Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **bcrypt** - Password hashing
- **JWT** - Authentication
- **Multer** - File uploads
- **CORS** - Cross-origin support

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios/Fetch** - HTTP requests

---

## Key Files Reference

| File | Purpose |
|------|---------|
| [server/server.js](../server/server.js) | Main server entry point |
| [server/config/database.js](../server/config/database.js) | DB connection pool |
| [server/controller/authController.js](../server/controller/authController.js) | Auth logic |
| [server/routes/auth.js](../server/routes/auth.js) | Auth endpoints |
| [client/src/App.jsx](../client/src/App.jsx) | Main React component |
| [.env](../.env) | Environment variables |

---

## Troubleshooting

### Database Connection Failed
```bash
# Test connection
node -e "const { Pool } = require('pg'); require('dotenv').config(); const pool = new Pool({user: process.env.PGUSER, host: process.env.PGHOST, database: process.env.PGDATABASE, password: process.env.PGPASSWORD, port: parseInt(process.env.PGPORT)}); pool.query('SELECT NOW()').then(r => {console.log('Connected!'); pool.end();}).catch(e => {console.error('Error:', e.message); pool.end();});"
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or on Windows PowerShell:
Get-Process -Name node | Stop-Process -Force
```

### Clear & Rebuild Database
```bash
# Recreate database completely
node -e "const { Client } = require('pg'); require('dotenv').config(); const client = new Client({user: process.env.PGUSER, host: process.env.PGHOST, password: process.env.PGPASSWORD, port: parseInt(process.env.PGPORT), database: 'postgres'}); client.connect().then(() => client.query('DROP DATABASE IF EXISTS renthive_db')).then(() => client.query('CREATE DATABASE renthive_db')).then(() => console.log('Done')).catch(e => console.error(e)).finally(() => client.end());"
```

---

## Notes

- The `backend/` and `frontend/` directories are placeholders
- The `-p/` directory in server is empty and can be removed
- All active development is in `server/` and `client/`
- Database migrations are version-controlled in `Database/migrations/`
- Upload files are stored in `server/uploads/profiles/`

---

**Last Updated:** December 16, 2025  
**Project Status:** 🚀 Ready for Development
