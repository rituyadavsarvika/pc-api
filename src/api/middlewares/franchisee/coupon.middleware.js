// Load utils
const AppError = require('../../../utils/error/appError');
const catchAsync = require('./../../../utils/error/catchAsync');
const validator = require('./../../../utils/validator');

// Load Model
const Coupon = require('./../../../models/franchisee/coupon.model');

const checkDuplicate = (req, res, next) => {
	const { code, franchiseeId } = req.body;
	validator
		.isDuplicate(Coupon.findOne({ code, franchiseeId }), code, 'code')
		.then(() => next())
		.catch(err => next(new AppError(err, 409)));
};

// middleware to get current usedCount
const getUsedCount = catchAsync(async (req, res, next) => {
	const id = req.params.id;

	const coupon = await Coupon.findOne({
		_id: id
	});

	req.body.usedCount = coupon?.usedCount;
	next();
});

module.exports = { checkDuplicate, getUsedCount };
