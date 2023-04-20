const jwt = require('jsonwebtoken');
const catchAsync = require('./../../../../utils/error/catchAsync');
const AppError = require('./../../../../utils/error/appError');
const config = require('./../../../../../config/keys');
const APIFeature = require('../../../../utils/apiFeatures');

// Load model
const Customer = require('./../../../../models/franchisee/customer/customerModel');
const EmailRoleRel = require('./../../../../models/emailRoleRel.model');
const Order = require('./../../../../models/franchisee/orders.model');

// Generate token by user._id
const getToken = (id, email) => {
	const payload = {
		id: id,
		email: email
	};

	return jwt.sign({ payload }, config.JWT_SECRET, {
		expiresIn: config.JWT_EXPIRES_IN
	});
};

// customer creation
const createCustomer = catchAsync(async (req, res, next) => {
	// create email role rel document
	const newEmailRole = await EmailRoleRel.create({
		email: req.body.email,
		userRole: 'CUSTOMER'
	});

	// Create new customer
	await Customer.create({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		phone: req.body.phone,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		franchiseeId: req.body.franchiseeId
	})
		.then(newCustomer => {
			// get token
			const token = getToken(newCustomer._id, newCustomer.email);
			res.status(201).json({
				status: 'success',
				token,
				role: 'CUSTOMER',
				id: newCustomer._id,
				name:
					newCustomer.firstName +
					(newCustomer.lastName ? ' ' + newCustomer.lastName : ''),
				franchiseeId: newCustomer.franchiseeId
			});
		})
		.catch(err => {
			// delete newEmailRole document
			newEmailRole.delete();
			console.log('err', `${err.name} ${err.message}`);
			return next(new AppError(`${err.name} ${err.message}`, 500));
		});
});

// get All customer under a franchisee
const getAllCustomer = catchAsync(async (req, res) => {
	const feature = new APIFeature(Customer.find(), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate();
	const customerList = await feature.query;

	// get count
	const cQuery = new APIFeature(
		Customer.countDocuments(),
		req.query
	).countFilter();
	const docCount = await cQuery.query;

	Promise.all([customerList]).then(() => {
		res.status(200).json({
			status: 'success',
			result: docCount,
			data: customerList
		});
	});
});

// get a customer by id
const getCustomer = catchAsync(async (req, res) => {
	const customer = await Customer.findOne({ _id: req.params.id });

	res.status(200).status(200).json({
		status: 'success',
		data: customer
	});
});

// update Customer by id
const updateCustomer = catchAsync(async (req, res, next) => {
	let { password, confirmPassword, franchiseeId } = req.body;
	if (password || confirmPassword || franchiseeId)
		return next(
			new AppError(
				'You are not allowed to change password or franchiseeId through this api',
				400
			)
		);

	const updatedCustomer = await Customer.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	);

	res.status(200).json({
		status: 'success',
		data: updatedCustomer
	});
});

/**
 * @description Controller to get orders. customer will be identified by email address
 */
const getCustomerOrders = catchAsync(async (req, res) => {
	const email = req.params.email;

	// get parent order by billing email address
	const feature = new APIFeature(
		Order.find({ 'billingAddress.email': email }),
		req.query
	)
		.filter()
		.sort()
		.limitFields()
		.paginate();
	const orderList = await feature.query;

	// get count
	const cQuery = new APIFeature(
		Order.countDocuments({ 'billingAddress.email': email }),
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

module.exports = {
	createCustomer,
	getAllCustomer,
	getCustomer,
	updateCustomer,
	getCustomerOrders
};
