// Load Utils
const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');
// const AppError = require('./../../../../utils/error/appError');

// Load service
const stripeService = require('./../../../../../service/stripeService');

// Load Model
const SubscriptionHistory = require('./../../../../models/franchisee/history/subscriptionHistoryModel');
const SubscriberConfig = require('./../../../../models/config/subscriberConfigModel');
const Franchisee = require('./../../../../models/franchisee/franchiseeModel');

// Controller to get all subscription with filter, sort, pagination
const getAllSubscriptionByCustomer = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        SubscriptionHistory.find().populate({
            path: 'subscriptionPlanId',
            model: 'SubscriptionPlan',
            select: 'name summary'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const subscriptionList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        SubscriptionHistory.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([subscriptionList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: subscriptionList
        });
    });
});

// function to get subscription history details
const getSubscriptionById = catchAsync(async (req, res) => {
    const subscriptionDetails = await SubscriptionHistory.findOne({
        _id: req.params.subscriptionId
    })
        .populate({
            path: 'subscriptionPlanId',
            model: 'SubscriptionPlan',
            select: 'name summary'
        })
        .populate({
            path: 'attributes.attributeId',
            model: 'SubscriptionAttribute',
            select: 'name'
        });

    res.status(200).json({
        status: 'success',
        data: subscriptionDetails
    });
});

// Controller to cancel subscription
const cancelSubscription = (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    const { stripeSubscriptionId, franchiseeId, isFreePlan } = req;

    if (!isFreePlan) {
        stripeService
            .cancelSubscription(stripeSubscriptionId)
            .then(() => {
                console.log('Stripe subscription cancellation done');
            })
            .catch(err => {
                return res
                    .status(400)
                    .json({ status: 'fail', message: err.message });
            });
    }

    SubscriptionHistory.findByIdAndUpdate(subscriptionId, {
        $set: { status: 'cancelled', cancelledAt: new Date() }
    })
        .then(() => {
            return SubscriberConfig.updateOne(
                { franchiseeId },
                { $unset: { subscriptionPlanId: 1 } }
            );
        })
        .then(() => {
            return res.status(201).json({
                status: 'success',
                message: 'Subscription cancelled successful'
            });
        })
        .catch(err => {
            return res
                .status(400)
                .json({ status: 'fail', message: err.message });
        });
};

const dataCorrection = (req, res) => {
    const { subscriptionPlanId, startAt, expireAt } = req.body;
    const { name, planType, regularPrice, offerPrice, features, attributes } =
        req;

    Franchisee.find({}).then(
        catchAsync(async franchiseeList => {
            await Promise.all(
                franchiseeList.map(async franchisee => {
                    // create new Subscription History
                    await SubscriptionHistory.updateMany(
                        { franchiseeId: franchisee._id },
                        {
                            subscriptionPlanId,
                            name,
                            regularPrice,
                            offerPrice,
                            features,
                            planType,
                            attributes,
                            startAt: new Date(startAt),
                            status: 'active'
                        },
                        {
                            upsert: true,
                            runValidators: true
                        }
                    );

                    // create new Subscriber Config
                    await SubscriberConfig.updateMany(
                        { franchiseeId: franchisee._id },
                        {
                            adminType: 'CA',
                            subscriptionPlanId,
                            subscriptionTakenAt: new Date(startAt),
                            subscriptionExpireAt: new Date(expireAt),
                            planType,
                            planPrice: offerPrice,
                            attributes
                        },
                        {
                            upsert: true,
                            runValidators: true
                        }
                    );

                    return;
                })
            );
        })
    );

    res.status(200).json({
        status: 'successful',
        message: 'Data Correction done'
    });
};

module.exports = {
    getAllSubscriptionByCustomer,
    getSubscriptionById,
    cancelSubscription,
    dataCorrection
};
