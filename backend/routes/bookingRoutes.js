const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, bookingController.createBooking);
router.get('/', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBookingById);
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router;
