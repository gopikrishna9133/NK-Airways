// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

const adminFlight = require('../controllers/adminFlightController');
const adminRoute = require('../controllers/adminRouteController');
const adminSchedule = require('../controllers/adminScheduleController');
const adminTier = require('../controllers/adminSeatTierController');
const adminPrice = require('../controllers/adminPriceController');
const adminReports = require('../controllers/adminReportsController');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// Flights
router.get('/flights', adminFlight.listFlights);
router.get('/flights/:id', adminFlight.getFlight);
router.post('/flights', adminFlight.createFlight);
router.put('/flights/:id', adminFlight.updateFlight);
router.delete('/flights/:id', adminFlight.deleteFlight);

// Routes
router.get('/routes', adminRoute.listRoutes);
router.get('/routes/:id', adminRoute.getRoute);
router.post('/routes', adminRoute.createRoute);
router.put('/routes/:id', adminRoute.updateRoute);
router.delete('/routes/:id', adminRoute.deleteRoute);

// Schedules
router.get('/schedules', adminSchedule.listSchedules);
router.get('/schedules/:id', adminSchedule.getSchedule);
router.post('/schedules', adminSchedule.createSchedule);
router.put('/schedules/:id', adminSchedule.updateSchedule);
router.delete('/schedules/:id', adminSchedule.deleteSchedule);


// Seat tiers
router.get('/tiers', adminTier.listTiers);
router.get('/tiers/:id', adminTier.getTier);
router.post('/tiers', adminTier.createTier);
router.put('/tiers/:id', adminTier.updateTier);
router.delete('/tiers/:id', adminTier.deleteTier);

// Prices
router.get('/prices', adminPrice.listPrices);
router.get('/prices/:id', adminPrice.getPrice);
router.post('/prices', adminPrice.createPrice);
router.put('/prices/:id', adminPrice.updatePrice);
router.delete('/prices/:id', adminPrice.deletePrice);

// Reports
router.get('/reports/bookings', adminReports.listBookings);
router.get('/reports/revenue-by-schedule', adminReports.revenueBySchedule);
router.get('/reports/manifest/:scheduleId', adminReports.manifestBySchedule);

module.exports = router;
