const catchAsync = require('./../../utils/error/catchAsync');
const AppError = require('./../../utils/error/appError');
const validator = require('./../../utils/validator');

// Load model
const OutgoingMailConfig = require('./../../models/outGoingMailConfigModel');

const checkDuplicate = (req, res, next) => {
	const adminType = req.body.adminType;
	const franchiseeId = req.body.franchiseeId;
	let query = undefined;

	if (adminType === 'CA') {
		query = OutgoingMailConfig.findOne({
			adminType: 'CA',
			franchiseeId
		});
	} else {
		query = OutgoingMailConfig.findOne({ adminType: 'SA' });
		req.body.franchiseeId = undefined;
	}

	validator
		.isDuplicate(query, 'Record')
		.then(() => next())
		.catch(err => next(new AppError(err, 409)));
};

const checkValidId = (req, res, next) => {
	const id = req.params.id;
	validator
		.isValidId(OutgoingMailConfig.findOne({ _id: id }), id)
		.then(() => next())
		.catch(err => next(new AppError(err, 404)));
};

module.exports = {
	checkDuplicate,
	checkValidId
};
