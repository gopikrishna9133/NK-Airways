const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireAdmin, scheduleController.createSchedule);
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.put('/:id', authenticate, requireAdmin, scheduleController.updateSchedule);
router.delete('/:id', authenticate, requireAdmin, scheduleController.deleteSchedule);

module.exports = router;
