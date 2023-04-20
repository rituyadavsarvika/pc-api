// Load Error handler
const AppError = require('../../../utils/error/appError');
const validator = require('./../../../utils/validator');

// Load Model
const Post = require('./../../../models/website/blogModel');

const checkValidId = (req, res, next) => {
	const postId = req.body.postId;

	Post.findOne({ _id: postId })
		.select('slug')
		.then(post => {
			// if no product found return
			if (validator.isEmptyObject(post))
				return next(new AppError('Invalid post Id'));

			// if product document found
			req.postSlug = post.slug;
			next();
		})
		.catch(err => next(new AppError(`${err.name} ${err.message}`, 500)));
};

module.exports = {
	checkValidId
};
