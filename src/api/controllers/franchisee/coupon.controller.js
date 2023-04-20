const moment = require('moment');

// Load Utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');
const validator = require('./../../../utils/validator');

// Load Model
const Coupon = require('./../../../models/franchisee/coupon.model');

// Create New Coupon code
const createNew = catchAsync(async (req, res) => {
	const newCode = await Coupon.create(req.body);
	res.status(201).json({
		status: 'success',
		data: newCode
	});
});

// get all coupon
const getAllCoupons = catchAsync(async (req, res) => {
	const feature = new APIFeature(
		Coupon.find().populate({
			path: 'franchiseeId',
			model: 'Franchisee',
			select: 'name'
		}),
		req.query
	)
		.filter()
		.sort()
		.limitFields()
		.paginate();
	const couponList = await feature.query;

	// get count
	const cQuery = new APIFeature(
		Coupon.countDocuments(),
		req.query
	).countFilter();
	const docCount = await cQuery.query;

	Promise.all([couponList]).then(() => {
		res.status(200).json({
			status: 'success',
			result: docCount,
			data: couponList
		});
	});
});

// Get a specific Coupon by id
const getCouponById = catchAsync(async (req, res) => {
	const coupon = await Coupon.findOne({ _id: req.params.id }).populate({
		path: 'franchiseeId',
		model: 'Franchisee',
		select: 'name'
	});

	res.status(200).status(200).json({
		status: 'success',
		data: coupon
	});
});

// get a specific coupon by coupon code
const applyCoupon = catchAsync(async (req, res) => {
	const { code, franchiseeId } = req.body;
	const currentTime = moment().utc().format();

	const coupon = await Coupon.findOne({
		code,
		franchiseeId,
		$expr: { $gt: ['$maxUse', '$usedCount'] },
		activeAt: {
			$lte: currentTime
		},
		expireAt: {
			$gt: currentTime
		}
	}).select('couponType value -_id');

	if (validator.isEmptyObject(coupon))
		res.status(404).json({ status: 'fail', message: 'Invalid Coupon' });
	else {
		res.status(200).status(200).json({
			status: 'success',
			data: coupon
		});

		// increment usedCount
		await Coupon.updateOne(
			{ code, franchiseeId },
			{
				$inc: { usedCount: 1 }
			}
		);
	}
});

// Update specific coupon
const updateCoupon = catchAsync(async (req, res, next) => {
	const updatedCoupon = await Coupon.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	);

	res.status(200).json({
		status: 'success',
		data: updatedCoupon
	});
});

const deleteCoupon = catchAsync(async (req, res) => {
	await Coupon.deleteOne({ _id: req.params.id });

	res.status(200).json({
		status: 'success',
		message: 'Deleted Successfully'
	});
});

module.exports = {
	createNew,
	getAllCoupons,
	getCouponById,
	applyCoupon,
	updateCoupon,
	deleteCoupon
};
