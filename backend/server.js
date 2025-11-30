const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const path = require("path");

// Middlewares
app.use(cors());
app.use(express.json());

// Routes imports
const authRoutes = require("./routes/authRoutes");
const flightRoutes = require("./routes/flightRoutes");
const routeRoutes = require("./routes/routeRoutes");
const scheduleRoutes = require("./routes/ScheduleRoutes");
const seatRoutes = require("./routes/seatRoutes");
const scheduleseatRoutes = require("./routes/scheduleseatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/admin");
const priceRoutes = require("./routes/priceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileController = require("./controllers/profileController");

// Mount admin routes
app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/seat", seatRoutes);
app.use("/api/schedule-seats", scheduleseatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/payments", paymentRoutes);

app.get(
  "/api/auth/me",
  profileController.authMiddleware,
  profileController.getProfile
);

app.put(
  "/api/auth/me",
  profileController.authMiddleware,
  profileController.updateProfile
);

app.post(
  "/api/auth/change-password",
  profileController.authMiddleware,
  profileController.changePassword
);

// Root route
app.get("/", (req, res) => {
  res.send("NK Airlines Backend Running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
