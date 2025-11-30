const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, paymentController.createPayment);
router.get('/:bookingId', authenticate, paymentController.getPaymentsForBooking);

module.exports = router;
