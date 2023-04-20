// Load utils
const catchAsync = require('../../utils/error/catchAsync');
const APIFeature = require('./../../utils/apiFeatures');

// load model
const GoogleAnalytics = require('../../models/googleAnalytics.model');

// Create New
const createNew = catchAsync(async (req, res) => {
	const newDoc = await GoogleAnalytics.create(req.body);
	res.status(200).json({ status: 'success', data: newDoc });
});

// get all mail config
const getAll = catchAsync(async (req, res, next) => {
	const feature = new APIFeature(GoogleAnalytics.find(), req.query)
		.filter()
		.limitFields();

	const analytics = await feature.query;

	Promise.all([analytics]).then(() => {
		res.status(200).json({
			status: 'success',
			data: analytics
		});
	});
});

// get by id
const getById = catchAsync(async (req, res) => {
	const config = await GoogleAnalytics.findOne({ _id: req.params.id });
	res.status(200).json({
		status: 'success',
		data: config
	});
});

const updateById = catchAsync(async (req, res) => {
	const updatedDoc = await GoogleAnalytics.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	);

	res.status(200).json({
		status: 'success',
		data: updatedDoc
	});
});

module.exports = { createNew, getAll, getById, updateById };
