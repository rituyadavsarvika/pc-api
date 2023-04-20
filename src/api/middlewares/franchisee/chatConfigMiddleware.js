const validator = require('./../../../utils/validator');

// Load Model
const ChatConfig = require('./../../../models/franchisee/chatConfigModel');

const checkIsMultiple = (req, res, next) => {
	const { name, adminType, franchiseeId } = req.body;
	let query = undefined;

	if (adminType === 'CA') {
		query = ChatConfig.findOne({
			name,
			adminType: 'CA',
			franchiseeId
		});
	} else {
		query = ChatConfig.findOne({ name, adminType: 'SA' });
		req.body.franchiseeId = undefined;
	}

	validator
		.isDuplicate(query, 'Record')
		.then(() => {
			req.body.active = true;
			next();
		})
		.catch(() => {
			req.body.active = false;
		});
};

// check chat type and payload
const checkPayload = (req, res, next) => {
    const { chatType, propertyId, chatId, manyChatDetails } = req.body;

    switch (chatType) {
        case 'twakto':
            if (!propertyId || !chatId)
                next(new AppError('PropertyId and/or chatId missing', 400));
            break;

        case 'manychat':
            if (!manyChatDetails || manyChatDetails.length < 1)
                next(new AppError('Invalid data format!', 400));
            break;

        default:
            next(new AppError(`'${chatType}' is invalid chat type!`, 400));
    }

    next();
};

module.exports = { checkIsMultiple, checkPayload };
