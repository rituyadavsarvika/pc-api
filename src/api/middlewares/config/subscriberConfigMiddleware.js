const AppError = require('../../../utils/error/appError');
const validator = require('../../../utils/validator');

// Load Model
const SubscriberConfig = require('../../../models/config/subscriberConfigModel');

const checkValidId = (req, res, next) => {
    const id = req.params.id;
    validator
        .isValidId(SubscriberConfig.findOne({ _id: id }), id)
        .then(() => next())
        .catch(() => next(new AppError('Invalid Id', 404)));
};

const getSubscriberDetails = (req, res, next) => {
    const { franchiseeId } = req.body;

    validator
        .isValidId(
            SubscriberConfig.findOne({ franchiseeId }).select(
                '+subscriptionPlanId'
            ),
            franchiseeId
        )
        .then(data => {
            req.subscriptionExpireAt = data?.subscriptionExpireAt;
            req.currentSubscriptionPlan = data?.subscriptionPlanId;
            req.currentPrice = data?.planPrice;
            next();
        })
        .catch(() => next(new AppError('Invalid Id', 404)));
};

module.exports = { checkValidId, getSubscriberDetails };
