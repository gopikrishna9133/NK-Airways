const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, bookingController.createBooking);             // passenger books a seat
router.get('/', authenticate, bookingController.getMyBookings);             // passenger's bookings
router.get('/:id', authenticate, bookingController.getBookingById);         // get booking (auth)
router.put('/:id/cancel', authenticate, bookingController.cancelBooking);   // cancel booking (passenger)

module.exports = router;
