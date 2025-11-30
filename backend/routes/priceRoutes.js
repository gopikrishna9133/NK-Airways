const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireAdmin, priceController.createPrice);
router.get('/', priceController.getAllPrices);
router.get('/:id', priceController.getPriceById);
router.put('/:id', authenticate, requireAdmin, priceController.updatePrice);
router.delete('/:id', authenticate, requireAdmin, priceController.deletePrice);

module.exports = router;
