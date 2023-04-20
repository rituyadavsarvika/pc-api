const AppError = require('../../../utils/error/appError');
const validator = require('../../../utils/validator');

// Load Model
const ChatConfig = require('../../../models/config/chatConfigModel');

const checkIsMultiple = (req, res, next) => {
    const adminType = req.body.adminType;
    const franchiseeId = req.body.franchiseeId;
    let query = undefined;

    if (adminType === 'CA') {
        query = ChatConfig.findOne({
            adminType: 'CA',
            franchiseeId
        });
    } else {
        query = ChatConfig.findOne({ adminType: 'SA' });
        req.body.franchiseeId = undefined;
    }

    validator
        .isDuplicate(query, 'Record')
        .then(() => next())
        .catch(err => next(new AppError(err, 409)));
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

module.exports = { checkIsMultiple,checkPayload };
