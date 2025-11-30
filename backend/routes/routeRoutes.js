const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireAdmin, routeController.createRoute); // admin only
router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);
router.put('/:id', authenticate, requireAdmin, routeController.updateRoute);
router.delete('/:id', authenticate, requireAdmin, routeController.deleteRoute);

module.exports = router;
