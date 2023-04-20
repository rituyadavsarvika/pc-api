const dateUtils = require('./../../../../utils/dateTime');
const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');

const BusinessOrder = require('./../../../../models/franchisee/business/businessOrderModel');

/**
 * @description Get all business orders
 */
const getAllBusinessOrders = catchAsync(async (req, res) => {
	const feature = new APIFeature(BusinessOrder.find(), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate();
	const orderList = await feature.query;

	// get count
	const cQuery = new APIFeature(
		BusinessOrder.countDocuments(),
		req.query
	).countFilter();
	const docCount = await cQuery.query;

	Promise.all([orderList, docCount]).then(() => {
		res.status(200).json({
			status: 'success',
			result: docCount,
			data: orderList
		});
	});
});

/**
 * @description get specific business order
 */
const getBusinessOrder = catchAsync(async (req, res) => {
	const order = await BusinessOrder.findOne({ _id: req.params.id })
		.populate({
			path: 'parentOrderId',
			model: 'Order',
			select: 'orderNo'
		})
		.populate({
			path: 'shippingId',
			model: 'ShippingMethod',
			select: 'name minDays maxDays'
		})
		.populate({
			path: 'products.id',
			model: 'Product',
			select: 'name images'
		})
		.populate({
			path: 'products.greetings.id',
			model: 'Product',
			select: 'name images'
		});

	res.status(200).status(200).json({
		status: 'success',
		data: order
	});
});

/**
 * @description update a specific business order
 */
const updateBusinessOrders = catchAsync(async (req, res) => {
	const orderId = req.params.id;
	const { status } = req.body;

	const updatedOrder = await BusinessOrder.findByIdAndUpdate(
		orderId,
		{
			$set: { status }
		},
		{
			new: true,
			runValidators: true
		}
	);

	Promise.all([updatedOrder]).then(() => {
		res.status(200).json({
			status: 'success',
			data: updatedOrder
		});
	});
});

/**
 * @description Set orders Filter by date
 */
const filterBYDate = catchAsync(async (req, res) => {
	// get variables
	const { searchDate, businessId } = req.body;

	// get start and end of a specific day
	const { startSearchDate, endSearchDate } =
		await dateUtils.generateSearchAbleDate(searchDate, 'DD/MM/YYYY');

	// generate condition
	const condition = {
		businessId,
		orderDate: {
			$gte: startSearchDate,
			$lt: endSearchDate
		}
	};

	// get oll orders filtered by date and franchisee with pagination
	const feature = new APIFeature(BusinessOrder.find(condition), req.query)
		.limitFields()
		.paginate();
	const orderList = await feature.query;

	// get total search result count
	const cQuery = new APIFeature(
		BusinessOrder.countDocuments(condition),
		req.query
	).countFilter();
	const docCount = await cQuery.query;

	res.status(200).json({
		status: 'success',
		result: docCount,
		data: orderList
	});
});

module.exports = {
	getAllBusinessOrders,
	getBusinessOrder,
	updateBusinessOrders,
	filterBYDate
};
