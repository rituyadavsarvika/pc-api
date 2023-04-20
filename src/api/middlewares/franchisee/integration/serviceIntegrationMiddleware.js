// Load utils
const Validator = require('./../../../../utils/validator');
const AppError = require('./../../../../utils/error/appError');
const catchAsync = require('../../../../utils/error/catchAsync');

// Load Model
const ServiceIntegration = require('./../../../../models/franchisee/integration/serviceIntegrationModel');

// middleware to check if multiple free plan
const checkIsMultiple = (req, res, next) => {
    const { subscriberId, serviceName } = req.body;

    const id = req.params.serviceId;

    let condition = { serviceName };

    // if (serviceName) condition['serviceName'] = serviceName;

    if (subscriberId) condition['subscriberId'] = subscriberId;

    if (id)
        condition['_id'] = {
            $ne: id
        };

    query = ServiceIntegration.findOne(condition);

    Validator.isDuplicate(query, `${serviceName} for field service name`)
        .then(() => next())
        .catch(err => next(new AppError(err, 409)));
};

// get by subscriberId
const getBySubscriberId = catchAsync(async (req, res, next) => {
    const { subscriberId } = req.body;

    const doc = await ServiceIntegration.findOne({ subscriberId }).select(
        'apiKey secretKey'
    );

    if (Validator.isEmptyObject(doc))
        next(new AppError("Integration isn't enabled yet"), 500);
    else {
        req.apiKey = doc?.apiKey;
        req.secretKey = doc?.secretKey;
        next();
    }
});

module.exports = {
    checkIsMultiple,
    getBySubscriberId
};
