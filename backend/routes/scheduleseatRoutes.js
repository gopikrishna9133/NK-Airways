const express = require('express');
const router = express.Router();
const scheduleSeatController = require('../controllers/scheduleseatController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/generate/:scheduleId', authenticate, requireAdmin, scheduleSeatController.generateScheduleSeats);
router.get('/schedule/:scheduleId', scheduleSeatController.getBySchedule);
router.get('/:id', scheduleSeatController.getById);
router.put('/:id/status', authenticate, requireAdmin, scheduleSeatController.updateSeatStatus);
router.delete('/:id', authenticate, requireAdmin, scheduleSeatController.deleteScheduleSeat);

module.exports = router;
