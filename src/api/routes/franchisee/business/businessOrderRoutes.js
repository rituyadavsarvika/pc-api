const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');

const Controller = require('./../../../controllers/franchisee/business/businessOrderController');

router
	.route('/')
	.get(authMiddleware.protectRoute, Controller.getAllBusinessOrders);

// get order list filter by date
router
	.route('/filter')
	.post(authMiddleware.protectRoute, Controller.filterBYDate);

router
	.route('/:id')
	.get(authMiddleware.protectRoute, Controller.getBusinessOrder)
	.patch(authMiddleware.protectRoute, Controller.updateBusinessOrders);

module.exports = router;
