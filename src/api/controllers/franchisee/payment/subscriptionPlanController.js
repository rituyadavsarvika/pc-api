const CONFIG = require('./../../../../../config/keys');
const stripe = require('stripe')(CONFIG.STRIPE_SECRET_KEY);

// Load utils
const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');

// Load Model
const SubscriptionPlan = require('../../../../models/franchisee/payment/subscriptionPlanModel');

// create new subscription attribute
const createSubscriptionPlan = catchAsync(async (req, res) => {
    delete req.body['isStripeConnected'];
    delete req.body['stripeProductId'];
    delete req.body['stripePriceId'];

    const newPlan = await SubscriptionPlan.create(req.body);

    res.status(201).json({ status: 'success', data: newPlan });
});

// get All Subscription Plan
const getAllSubscriptionPlan = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        SubscriptionPlan.find().populate({
            path: 'logo',
            model: 'MediaContent',
            select: 'filePath altText'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const planList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        SubscriptionPlan.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([planList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: planList
        });
    });
});

// get All Subscription Plan for admin
const getAllAdminPlan = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        SubscriptionPlan.find({
            isFreePlan: false,
            isStripeConnected: true
        }).populate({
            path: 'logo',
            model: 'MediaContent',
            select: 'filePath altText'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const planList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        SubscriptionPlan.countDocuments({
            isFreePlan: false,
            isStripeConnected: true
        }),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([planList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: planList
        });
    });
});

// get attribute details by Id
const getSubscriptionPlanById = catchAsync(async (req, res) => {
    const planDetails = await SubscriptionPlan.findOne({
        _id: req.params.id
    })
        .populate({
            path: 'logo',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        .populate({
            path: 'attributes.attributeId',
            model: 'SubscriptionAttribute',
            select: 'name'
        });

    res.status(200).json({
        status: 'success',
        data: planDetails
    });
});

// update Attribute
const updateSubscriptionPlanById = catchAsync(async (req, res) => {
    const { priceHasChanged, stripeProductId, planType } = req;
    const planId = req.params.id;

    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
        planId,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );
    // call price trigger function if price changed
    if (priceHasChanged && stripeProductId)
        await triggerPriceUpdate(
            req.body.offerPrice,
            stripeProductId,
            planId,
            planType
        );

    res.status(200).json({ status: 'Success', data: updatedPlan });
});

// delete attribute
const deleteSubscriptionPlan = catchAsync(async (req, res) => {
    await SubscriptionPlan.deleteOne({ _id: req.params.id });
    res.status(200).json({
        status: 'Success',
        message: 'Subscription Plan deleted Successfully'
    });
});

// Controller to create stripe product
const connectStripeProductByPlanId = (req, res) => {
    let { name, summary, planType, offerPrice } = req;
    offerPrice = parseFloat(offerPrice);
    const planId = req.params.id;
    const interval = planType === 'monthly' ? 'month' : 'year';

    if (offerPrice > 0.0) {
        stripe.products
            .create({
                name,
                type: 'service',
                description: summary,
                metadata: { planId }
            })
            .then(stripeProduct => {
                return stripe.prices.create({
                    unit_amount: parseInt(offerPrice * 100),
                    currency: 'usd',
                    recurring: { interval },
                    product: stripeProduct.id
                });
            })
            .then(stripePrice => {
                return SubscriptionPlan.findByIdAndUpdate(
                    planId,
                    {
                        $set: {
                            stripeProductId: stripePrice.product,
                            stripePriceId: stripePrice.id,
                            isStripeConnected: true
                        }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                ).select('isStripeConnected');
            })
            .then(updatedProduct =>
                res
                    .status(200)
                    .json({ status: 'success', data: updatedProduct })
            )
            .catch(err => {
                res.status(500).json({
                    status: 'fail',
                    message: `${err.name} ${err.message}`
                });
            });
    } else {
        SubscriptionPlan.findByIdAndUpdate(
            planId,
            {
                $set: {
                    isStripeConnected: true
                }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .select('isStripeConnected')
            .then(updatedProduct =>
                res
                    .status(200)
                    .json({ status: 'success', data: updatedProduct })
            )
            .catch(err => {
                res.status(500).json({
                    status: 'fail',
                    message: `${err.name} ${err.message}`
                });
            });
    }
};

// function to trigger price update
const triggerPriceUpdate = (offerPrice, stripeProductId, planId, planType) => {
    const interval = planType === 'monthly' ? 'month' : 'year';

    return new Promise((resolve, reject) => {
        stripe.prices
            .create({
                unit_amount: parseInt(offerPrice * 100),
                currency: 'usd',
                recurring: { interval },
                product: stripeProductId
            })
            .then(stripePrice => {
                return SubscriptionPlan.findByIdAndUpdate(
                    planId,
                    {
                        $set: {
                            stripePriceId: stripePrice.id
                        }
                    },
                    {
                        runValidators: true
                    }
                );
            })
            .then(updatedPlan => resolve(updatedPlan))
            .catch(() => reject());
    });
};

module.exports = {
    createSubscriptionPlan,
    getAllSubscriptionPlan,
    getAllAdminPlan,
    getSubscriptionPlanById,
    updateSubscriptionPlanById,
    deleteSubscriptionPlan,
    connectStripeProductByPlanId
};
