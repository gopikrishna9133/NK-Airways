# NK Airways – Airline Reservation System

## ✈️ Overview
NK Airways is a full-stack airline reservation system designed to manage flight operations, schedules, pricing, seat allocation, and bookings for both passengers and administrators. The platform is built using a React frontend, a Node.js/Express backend, and a fully normalized MySQL relational database. The system supports secure authentication, real-time seat availability, and a complete booking workflow.

## 🚀 Features

### 🔐 Authentication & Roles
- Signup and Login with JWT
- Role-based access (Admin / Passenger)
- Profile update and password change

### 🧍 Passenger Features
- Search flights by origin, destination, date
- View schedules, tiers, and seat availability
- Seat selection with real-time status
- Booking with automatic PNR generation
- Payment simulation
- View upcoming & past bookings
- Boarding pass view/download

### 🛠 Admin Features
- Manage Flights (CRUD)
- Manage Routes (CRUD)
- Manage Schedules (CRUD)
- Generate schedule seats
- Set seat-tier-based pricing (Economy, Business, Premium)
- Reporting (future scope)

## 📁 Project Structure
```
nk-airways/
│
├── backend/         # Node.js + Express API
├── frontend/        # React Application
├── database/        # MySQL
└── README.md
```

## 🧩 Tech Stack

### Frontend
- React
- React Router
- React Query
- TailwindCSS
- Axios

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- Bcrypt
- CORS

### Database
- Fully normalized relational schema
- 16+ interlinked tables (Users, Flights, Routes, Schedules, Pricing, Seats, Bookings, Payments, etc.)
- Triggers, FKs, and constraints for data integrity

## 🏗 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/gopikrishna9133/nk-airways.git
cd nk-airways
```

### 2️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```

### 3️⃣ Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## ▶️ Running Backend & Frontend Together

Your folder structure:
```
nk-airways/
  backend/
  frontend/
  database/
```

### Step 1 — Create `package.json` in root (if not present)
```bash
cd nk-airways
npm install
npm init -y
```

### Step 2 — Install concurrently
```bash
npm install concurrently --save-dev
```

### Step 3 — Add script to root `package.json`
```json
"scripts": {
  "dev": "concurrently \"npm run dev --prefix backend\" \"npm run dev --prefix frontend\""
}
```

### Step 4 — Run both servers
```bash
npm run dev
```

## ⚙️ Environment Variables (Backend)
Create `backend/.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=nkuser
DB_PASS=Nk1234
DB_NAME=nk_airways
NODE_ENV=development
JWT_SECRET=supersecretkey
```
## JWT_SECRET KEY
To get secret key run this in cmd or powershell or node
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
## 🛢 Database Setup
### Create Database
```sql
CREATE DATABASE nk_airways;
```

### Run Schema in MySQL Workbench

use MySQL Workbench -
run schema.sql file in MySQL Workbench to create required tables,
run seed.sql file in MySQL Workbench to insert sample data. 
run report.sql file in MySQL Workbench to get reports of project.


## 📡 API Endpoints Summary

### Auth
- POST `/api/auth/signup`
- POST `/api/auth/login`

### Admin
- `/api/admin/flights`
- `/api/admin/routes`
- `/api/admin/schedules`
- `/api/admin/schedules/:id/generate-seats`
- `/api/admin/pricing`

### Passenger
- `/api/passenger/search`
- `/api/passenger/bookings`
- `/api/passenger/profile`

## 🎨 UI Pages
- Login / Signup  
- Admin Dashboard  
- Flights, Routes, Schedules Management  
- Pricing Management  
- Passenger Dashboard  
- Flight Search  
- Seat Selection  
- Payment  
- Bookings  
- Profile  

## 🔮 Future Enhancements
- Real payment gateway (Stripe/Razorpay)
- Real-time dynamic seat map
- Admin analytics (revenue, load factor)
- Email/SMS notifications
- Cloud deployment with CI/CD
- Optimistic locking for high-demand bookings

## 🏁 Conclusion
NK Airways delivers a scalable, secure, and production-ready reservation system architecture. With strong relational integrity, modern frontend design, and a modular backend, this system provides a complete foundation for enterprise-level airline operations and future enhancements.
