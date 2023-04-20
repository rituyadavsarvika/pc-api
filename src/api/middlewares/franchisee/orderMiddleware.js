// Load Error handler
const AppError = require('../../../utils/error/appError');

const checkProductDetails = (req, res, next) => {
	const { vendorDetails } = req.body;

	if (!Array.isArray(vendorDetails) || vendorDetails.length < 1)
		return next(new AppError('No product found', 400));
	else next();
};

module.exports = { checkProductDetails };
