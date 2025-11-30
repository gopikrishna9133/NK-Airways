const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireAdmin, seatController.createSeat);
router.get('/', seatController.getAllSeats);
router.get('/:id', seatController.getSeatById);
router.put('/:id', authenticate, requireAdmin, seatController.updateSeat);
router.delete('/:id', authenticate, requireAdmin, seatController.deleteSeat);

module.exports = router;
