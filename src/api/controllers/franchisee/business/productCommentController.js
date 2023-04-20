const catchAsync = require('./../../../../utils/error/catchAsync');
const AppError = require('./../../../../utils/error/appError');
const APIFeature = require('./../../../../utils/apiFeatures');

// Load model
const Model = require('../../../../models/franchisee/business/productCommentModel');

// first level comment not reply of a comment
const createNewComment = (req, res, next) => {
	let { productId, authorName, authorEmail, rating, commentAt, message } =
		req.body;

	// formate data
	authorEmail = authorEmail ? authorEmail : undefined;
	authorName = authorName ? authorName : undefined;
	const productSlug = req.productSlug;

	Model.create({
		productId,
		productSlug,
		authorName,
		authorEmail,
		commentAt,
		message,
		rating,
		reply: []
	})
		.then(newComment => {
			res.status(201).json({
				status: 'success',
				data: newComment
			});
		})
		.catch(err => next(new AppError(`${err.name} ${err.message}`, 500)));
};

// get all blog comments
const getAllComment = catchAsync(async (req, res) => {
	const feature = new APIFeature(Model.find(), req.query)
		.filter()
		.limitFields()
		.paginate();
	const commentList = await feature.query;

	// get count
	const cQuery = new APIFeature(
		Model.countDocuments(),
		req.query
	).countFilter();

	const docCount = await cQuery.query;

	Promise.all([commentList, docCount]).then(() => {
		res.status(200).json({
			status: 'success',
			result: docCount,
			data: commentList
		});
	});
});
const getComment = catchAsync(async (req, res) => {});
const getCommentByPost = catchAsync(async (req, res) => {});

module.exports = {
	createNewComment,
	getAllComment,
	getComment,
	getCommentByPost
};
