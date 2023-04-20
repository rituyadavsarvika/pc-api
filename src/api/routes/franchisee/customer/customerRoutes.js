const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const emailRoleRelMiddleware = require('../../../middlewares/emailRole.middleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const customerMiddleware = require('../../../middlewares/franchisee/customer/customerMiddleware');

// Load Controller
const Controller = require('../../../controllers/franchisee/customer/customerController');
const OrderController = require('../../../controllers/franchisee/orderController');

/**
 * @param  {} '/' root route
 * @description Create new customer and get all customer under a franchisee
 * @middleware check duplicate customer by email address under a specific franchisee
 * @Controller customerController.createCustomer
 */
router
	.route('/')
	.post(
		[
			emailRoleRelMiddleware.checkDuplicateEmail,
			franchiseeMiddleware.checkValidId
		],
		Controller.createCustomer
	)
	.get(authMiddleware.protectRoute, Controller.getAllCustomer);

/**
 * @route /baseURL/customers/customerId
 */
router
	.route('/:id')
	.get(Controller.getCustomer)
	.patch(authMiddleware.protectRoute, Controller.updateCustomer);

/**
 * @description get customer wise orders. customer will be identified by email address
 */
router
	.route('/:email/orders')
	.get(authMiddleware.protectRoute, Controller.getCustomerOrders);

/**
 * @description get customer order details.
 */
router
	.route('/:email/orders/:orderId')
	.get(
		[authMiddleware.protectRoute, customerMiddleware.getOrderId],
		OrderController.getOrder
	);

module.exports = router;
