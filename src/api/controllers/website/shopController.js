// load utils
const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// Load Model
const Shop = require('./../../../models/website/shopModel');
/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description this with do insertion if no data found with provided franchiseeId.
 * if data found then it will update that document
 */
const upsertShopData = catchAsync(async (req, res) => {
	const { data, franchiseeId } = req.body;

	const shop = await Shop.updateOne(
		{ franchiseeId },
		{ data, franchiseeId },
		{ upsert: true }
	);
	res.status(200).json({ status: 'success', data: shop });
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description get all shop data
 */
const getAllShopData = catchAsync(async (req, res) => {
	const feature = new APIFeature(Shop.find(), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate();
	const shopList = await feature.query;

	// get count
	const cQuery = new APIFeature(
		Shop.countDocuments(),
		req.query
	).countFilter();
	const docCount = await cQuery.query;

	Promise.all([shopList, docCount]).then(() => {
		res.status(200).json({
			status: 'success',
			result: docCount,
			data: shopList
		});
	});
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description get franchisee wise shop data
 */
const getShopData = catchAsync(async (req, res) => {
	const shopData = await Shop.findOne({
		franchiseeId: req.params.franchiseeId
	});

	res.status(200).json({ status: 'success', data: shopData });
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Delete wise shop data
 */
const deleteShopData = catchAsync(async (req, res) => {
	await Shop.deleteOne({
		_id: req.params.id
	});

	res.status(200).json({
		status: 'success',
		message: 'Data deleted successfully'
	});
});

module.exports = {
	upsertShopData,
	getAllShopData,
	getShopData,
	deleteShopData
};
