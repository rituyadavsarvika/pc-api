const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const config = require('./../../../../config/keys');
const validator = require('./../../../utils/validator');

// Load Error handler
const catchAsync = require('./../../../utils/error/catchAsync');

// Load Model
const emailRoleModel = require('./../../../models/emailRoleRel.model');

const decodeToken = catchAsync(async (req, res, next) => {
	const token = req.body.token;

	// Decode token with jwt secret key
	const decodedToken = await promisify(jwt.verify)(token, config.JWT_SECRET);

	const doc = await emailRoleModel.findOne({
		email: decodedToken.payload?.email
	});

	if (validator.isEmptyObject(doc)) {
		return res.status(200).json({
			status: 'success',
			data: {
				isValid: false
			}
		});
	}
	const data = {
		roleType: doc.userRole === 'CUSTOMER' ? 'customer' : 'user',
		email: decodedToken.payload?.email,
		id: decodedToken.payload?.id,
		iat: decodedToken.iat
	};
	req.data = data;

	next();
});

module.exports = { decodeToken };
