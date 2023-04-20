const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');

// Load Controller
const Controller = require('./../../controllers/website/shopController');

router
	.route('/')
	.post(authMiddleware.protectRoute, Controller.upsertShopData)
	.get(authMiddleware.protectRoute, Controller.getAllShopData);

router.route('/:franchiseeId').get(Controller.getShopData);

router
	.route('/:id')
	.delete(authMiddleware.protectRoute, Controller.deleteShopData);

module.exports = router;
