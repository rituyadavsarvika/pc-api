const AppError = require('./../../../../utils/error/appError');
const Validator = require('./../../../../utils/validator');
const catchAsync = require('./../../../../utils/error/catchAsync');

// Load Model
const SubscriptionPlan = require('./../../../../models/franchisee/payment/subscriptionPlanModel');

// middleware to check valid plan id
const isValidId = (req, res, next) => {
    const id =
        req.params.id || req.body.subscriptionPlanId || req?.subscriptionPlanId;

    const { offerPrice } = req.body;
    let priceHasChanged = false;

    Validator.isValidId(
        SubscriptionPlan.findOne({ _id: id }).select([
            '+stripeProductId',
            '+stripePriceId'
        ]),
        id,
        'Subscription Plan'
    )
        .then(data => {
            req.name = data?.name;
            req.summary = data?.summary;
            req.planType = data?.planType;
            req.regularPrice = data?.regularPrice;
            req.offerPrice = data?.offerPrice;
            req.features = data?.features;
            req.attributes = data?.attributes;
            req.productId = data?.stripeProductId;
            req.priceId = data?.stripePriceId;
            req.isFreePlan = data?.isFreePlan;

            if (
                offerPrice &&
                parseFloat(offerPrice) !== parseFloat(data?.offerPrice)
            ) {
                priceHasChanged = true;
                req.stripeProductId = data?.stripeProductId;
            }

            req.priceHasChanged = priceHasChanged;

            if (offerPrice && parseFloat(offerPrice) < 1.0)
                req.body.isFreePlan = true;
            else req.body.isFreePlan = false;
            next();
        })
        .catch(() => next(new AppError('Invalid Subscription Plan Id', 404)));
};

const CheckIfStripeConnected = (req, res, next) => {
    const id = req.params.id || req.body.subscriptionPlanId;

    Validator.isValidId(
        SubscriptionPlan.findOne({ _id: id, isStripeConnected: true }),
        id,
        'Subscription Plan'
    )
        .then(() => next())
        .catch(() =>
            next(
                new AppError(
                    `Invalid Plan or provided Plan is not connected with Stripe`,
                    404
                )
            )
        );
};

const getFreePlan = catchAsync(async (req, res, next) => {
    const freePlan = await SubscriptionPlan.findOne({
        $and: [
            { isFreePlan: true },
            { publish: true }
        ]
    });

    if (freePlan && !Validator.isEmptyObject(freePlan))
        req.body.subscriptionPlanId = freePlan._id;
    else next(new AppError('No temp plan found in the system', 404));

    next();
});

// middleware to check if plan downgrade or not
const isPlanDowngrade = (req, res, next) => {
    const { offerPrice, currentSubscriptionPlan, currentPrice } = req;

    if (currentSubscriptionPlan && parseFloat(offerPrice) < currentPrice)
        next(new AppError(`Plan downgrade is not permissible`, 400));
    else next();
};

// function to set isFreePlan flag
const setFreePlan = (req, res, next) => {
    let { offerPrice, isCustom } = req.body;
    offerPrice = offerPrice ? parseFloat(offerPrice) : 0.0;

    if (!offerPrice || offerPrice == 0.0) req.body.isFreePlan = true;

    if (isCustom) req.body.isFreePlan = false;
    next();
};

// middleware to check if multiple free plan
const checkIsMultipleFreePlan = (req, res, next) => {
    const isFreePlan = req.body.isFreePlan;
    if (isFreePlan) {
        query = SubscriptionPlan.findOne({
            isFreePlan: true
        });

        Validator.isDuplicate(query, 'Free Subscription Plan')
            .then(() => next())
            .catch(err => next(new AppError(err, 409)));
    } else next();
};

module.exports = {
    isValidId,
    CheckIfStripeConnected,
    getFreePlan,
    isPlanDowngrade,
    setFreePlan,
    checkIsMultipleFreePlan
};
