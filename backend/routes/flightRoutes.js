const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireAdmin, flightController.createFlight); // admin only
router.get('/', flightController.getAllFlights);
router.get('/:id', flightController.getFlightById);
router.put('/:id', authenticate, requireAdmin, flightController.updateFlight);
router.delete('/:id', authenticate, requireAdmin, flightController.deleteFlight);

module.exports = router;
