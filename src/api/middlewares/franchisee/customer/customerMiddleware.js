// Load Error handler
const AppError = require('../../../../utils/error/appError');
const catchAsync = require('./../../../../utils/error/catchAsync');

// Load Controllers
const Order = require('../../../../models/franchisee/orders.model');

const getOrderId = catchAsync(async (req, res, next) => {
	const { email, orderId } = req.params;

	// get parent order
	const parentOrder = await Order.findOne({
		'billingAddress.email': email,
		_id: orderId
	});

	req.params.id = parentOrder._id;
	next();
});

module.exports = { getOrderId };
