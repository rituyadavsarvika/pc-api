const catchAsync = require('./../../utils/error/catchAsync');
const AppError = require('./../../utils/error/appError');
const validator = require('./../../utils/validator');

// Load model
const GoogleAnalytics = require('./../../models/googleAnalytics.model');

const checkDuplicate = (req, res, next) => {
	const adminType = req.body.adminType;
	const franchiseeId = req.body.franchiseeId;
	let query = undefined;

	if (adminType === 'CA') {
		query = GoogleAnalytics.findOne({
			adminType: 'CA',
			franchiseeId
		});
	} else {
		query = GoogleAnalytics.findOne({ adminType: 'SA' });
		req.body.franchiseeId = undefined;
	}

	validator
		.isDuplicate(query, 'Record')
		.then(() => next())
		.catch(err => next(new AppError(err, 409)));
};

module.exports = { checkDuplicate };
