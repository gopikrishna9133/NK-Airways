const express = require('express');
const router = express.Router();
const seattierController = require('../controllers/seattierController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireAdmin, seattierController.createTier);
router.get('/', seattierController.getAllTiers);
router.get('/:id', seattierController.getTierById);
router.put('/:id', authenticate, requireAdmin, seattierController.updateTier);
router.delete('/:id', authenticate, requireAdmin, seattierController.deleteTier);

module.exports = router;
