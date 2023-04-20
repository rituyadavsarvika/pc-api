// load Utils
const validator = require('../../../utils/validator');
const catchAsync = require('../../../utils/error/catchAsync');

// Load Model
const userModel = require('../../../models/auth/usersModel');

/**
 * @description API to verify JWT token is valid or not.
 */
const verifyToken = catchAsync(async (req, res) => {
	const { roleType, email, id, iat } = req.data;
	if (!roleType || !email || !id || !iat) {
		return res.status(200).json({
			status: 'success',
			data: {
				isValid: false
			}
		});
	}

	let isValid = true;

	if (roleType && roleType === 'user') {
		decodedUser = await userModel.findOne({
			_id: id,
			active: true
		});
	} else {
		decodedUser = await Customer.findOne({ _id: id });
	}

	// get user information with decoded User id
	if (validator.isEmptyObject(decodedUser)) isValid = false;

	// 4) check if user changed password after token issued
	if (decodedUser.changedPasswordAfterToken(iat)) isValid = false;

	res.status(200).json({
		status: 'success',
		data: {
			isValid
		}
	});
});

module.exports = { verifyToken };
