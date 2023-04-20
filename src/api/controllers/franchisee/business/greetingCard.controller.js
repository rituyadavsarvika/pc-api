const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');

// Load utils
const fileUtil = require('./../../../../utils/generateFile');

// Load Service
const S3Service = require('../../../../../service/s3service');

// Load Model
const GreetingCard = require('../../../../models/franchisee/business/greetingCardModel');

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description Create business wise greeting card
 */
const createCard = catchAsync(async (req, res) => {
	let { name, categoryIds, businessId, franchiseeId, active, price } =
		req.body;

	// get Image
	const imagePath = req.body.files?.image[0]?.path;

	let imageLocation = undefined;
	// upload image if exist
	if (imagePath) {
		// upload header image & get image location
		imageLocation = await fileUtil.generateFile(imagePath);
	}

	categoryIds = categoryIds ? JSON.parse(categoryIds) : undefined;

	const newCard = await GreetingCard.create({
		name,
		businessId,
		franchiseeId,
		active,
		price,
		categoryIds,
		image: imageLocation
	});
	res.status(200).json({ status: 'success', data: newCard });
});

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description get all greeting card. this endpoint accept filter, fields limiting, sorting, pagination and searching
 * @description categoryIds, businessId and franchiseeId populate done
 */
const getAllCard = catchAsync(async (req, res) => {
	const feature = new APIFeature(
		GreetingCard.find()
			.populate({
				path: 'businessId',
				model: 'Business',
				select: 'name'
			})
			.populate({
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
	const cards = await feature.query;

	// get count
	const cQuery = new APIFeature(
		GreetingCard.countDocuments(),
		req.query
	).countFilter();
	const docCount = await cQuery.query;

	Promise.all([cards, docCount]).then(() => {
		res.status(200).json({
			status: 'success',
			result: docCount,
			data: cards
		});
	});
});

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description get a specific greeting card. this endpoint accept filter, fields limiting, sorting, pagination and searching
 */
const getCard = catchAsync(async (req, res) => {
	const id = req.params.id;
	const card = await GreetingCard.findOne({ _id: id })
		.populate({
			path: 'categoryIds',
			model: 'Category',
			select: 'name'
		})
		.populate({
			path: 'businessId',
			model: 'Business',
			select: 'name'
		})
		.populate({
			path: 'franchiseeId',
			model: 'Franchisee',
			select: 'name'
		});

	res.status(200).status(200).json({
		status: 'success',
		data: card
	});
});

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description Update Greeting card by id
 */
const updateCard = catchAsync(async (req, res) => {
	const updatedCard = await GreetingCard.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	);

	res.status(200).json({
		status: 'success',
		data: updatedCard
	});
});

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description Upload new image By _id
 */
const uploadImage = catchAsync(async (req, res) => {
	const previousImage = req.body.image;
	// get Image
	const imagePath = req.body.files?.image[0]?.path;

	let imageLocation;
	// upload image if exist
	if (imagePath) {
		// upload header image & get image location
		imageLocation = await fileUtil.generateFile(imagePath);

		if (previousImage) {
			S3Service.deleteFile(previousImage);
		}

		updatedCard = await GreetingCard.findByIdAndUpdate(
			req.params.id,
			{ image: imageLocation },
			{
				new: true,
				runValidators: true
			}
		);

		return res.status(200).json({
			status: 'Success',
			data: updatedCard
		});
	}

	res.status(200).json({ status: 'fail', message: 'Nothing to upload' });
});

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description Delete Greeting card By _id
 */
const deleteCard = catchAsync(async (req, res) => {
	await GreetingCard.deleteOne({ _id: req.params.id });

	res.status(200).json({
		status: 'success',
		message: 'Deleted Successfully'
	});
});

module.exports = {
	createCard,
	getAllCard,
	getCard,
	updateCard,
	uploadImage,
	deleteCard
};
