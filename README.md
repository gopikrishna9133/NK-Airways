# ✈️ NK Airways – Airline Reservation System

## 📌 Overview
NK Airways is a full-stack airline reservation system built to demonstrate real-world booking workflows, role-based access control, and relational database design.  
The system supports both **Passengers** and **Administrators**, covering the complete lifecycle from flight creation to booking confirmation.

---

## 🌐 Live Deployment

- **Frontend (Vercel)**  
  https://nk-airways.vercel.app

- **Backend API (Railway)**  
  https://nk-airways-production.up.railway.app

> ⚠️ Payments are simulated. This project is for learning and portfolio purposes.

---

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based authorization (Admin / Passenger)
- Secure password hashing (bcrypt)
- Token expiration handling
- Multi-tab logout synchronization

---

### 🧍 Passenger Capabilities
- Search flights by origin, destination, and date
- View schedules, pricing tiers, and seat availability
- Seat selection with real-time status
- Booking with automatic PNR generation
- View upcoming and past bookings
- Profile view (read-only frontend)

---

### 🛠 Administrator Capabilities
- Manage flights (CRUD)
- Manage routes (CRUD)
- Manage schedules (CRUD)
- Generate seats per schedule
- Configure tier-based pricing
- Reporting foundation (extensible)

---

## 🏗 System Architecture

```
React (Vite) SPA
        |
        | HTTPS
        v
Node.js + Express API
        |
        | TCP
        v
MySQL (Relational Database)
```

---

## 🧩 Tech Stack

### Frontend
- React (TypeScript)
- React Router
- React Query
- Axios
- Vite

### Backend
- Node.js
- Express.js
- JWT Authentication
- Bcrypt
- CORS

### Database
- MySQL
- Fully normalized schema
- Foreign keys and constraints
- 16+ related tables

---

## 📁 Project Structure

```
nk-airways/
├── frontend/
├── backend/
├── database/
└── README.md
```

---

## 💻 Local Development Setup

### Clone Repository
```bash
git clone https://github.com/gopikrishna9133/nk-airways.git
cd nk-airways
npm install
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚢 Deployment Notes

- Frontend deployed on **Vercel**
- Backend and MySQL deployed on **Railway**
- SPA routing handled via `vercel.json`
- API base URL configured via environment variables

---

## 🏁 Summary
NK Airways demonstrates a complete, production-style full-stack system with real deployment, clean architecture, and scalable design.
