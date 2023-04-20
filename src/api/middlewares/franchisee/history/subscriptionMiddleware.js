const AppError = require('../../../../utils/error/appError');
const Validator = require('../../../../utils/validator');

// Load Model
const SubscriptionHistory = require('../../../../models/franchisee/history/subscriptionHistoryModel');

// middleware to check valid plan id
const isValidId = (req, res, next) => {
    const id = req.params.subscriptionId || req.body.subscriptionId;

    Validator.isValidId(
        SubscriptionHistory.findOne({ _id: id }),
        id,
        'Subscription'
    )
        .then(data => {
            req.stripeSubscriptionId = data?.stripeSubscriptionId;
            req.franchiseeId = data?.franchiseeId;
            req.subscriptionPlanId = data?.subscriptionPlanId;
            next();
        })
        .catch(() => next(new AppError('Invalid Subscription Id', 404)));
};

const checkByStripeSubscriptionBy = (req, res, next) => {
    const stripeSubscriptionId =
        req?.stripeSubscriptionId || req?.subscriptionId;

    Validator.isValidId(
        SubscriptionHistory.findOne({ stripeSubscriptionId }).sort({
            createdAt: -1
        }),
        stripeSubscriptionId,
        'Subscription'
    )
        .then(data => {
            req.status = data?.status;
            next();
        })
        .catch(() => next(new AppError('Invalid Subscription Id', 404)));
};

module.exports = {
    isValidId,
    checkByStripeSubscriptionBy
};
