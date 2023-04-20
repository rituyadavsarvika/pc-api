// Load Utils
const catchAsync = require('../../../../utils/error/catchAsync');

// Load Model
const GreetingCard = require('./../../../../models/franchisee/business/greetingCardModel');

const getExistingImage = catchAsync(async (req, res, next) => {
	const id = req.params.id;

	const card = await GreetingCard.findOne({
		_id: id
	});

	req.body.image = card?.image;
	next();
});

module.exports = { getExistingImage };
