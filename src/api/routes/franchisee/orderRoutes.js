const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');
const orderMiddleware = require('../../middlewares/franchisee/orderMiddleware');

// Load Controller
const Controller = require('./../../controllers/franchisee/orderController');

// main route (/baseurl/orders/) of getting order
router
	.route('/')
	.post(
		[
			franchiseeMiddleware.checkValidIdMandatory,
			orderMiddleware.checkProductDetails
		],
		Controller.createNewOrder
	)
	.get(authMiddleware.protectRoute, Controller.getAllOrder);

// get order list filter by date
router
	.route('/filter/:franchiseeId')
	.post(authMiddleware.protectRoute, Controller.filterBYDate);

// main route (/baseurl/orders/orderId) of getting order
router
	.route('/:id')
	.get(authMiddleware.protectRoute, Controller.getOrder)
	.patch(authMiddleware.protectRoute, Controller.updateOrder);

module.exports = router;
