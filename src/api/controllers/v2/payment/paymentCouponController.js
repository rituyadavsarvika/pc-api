// const config = require('../../../../../config/keys');
// const stripe = require('stripe')(config.STRIPE_SECRET_KEY);

const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');

// Load Service
const stripeService = require('../../../../../service/stripeService');
const subscriberConfigService = require('../../../../../service/subscriberConfigService');
const subscriptionHistoryService = require('../../../../../service/subscriptionHistoryService');

// Load Model
const Subscriber = require('../../../../models/franchisee/franchiseeModel');
const SubscriberConfig = require('../../../../models/config/subscriberConfigModel');
const User = require('../../../../models/auth/usersModel');
const SubscriptionHistory = require('../../../../models/franchisee/history/subscriptionHistoryModel');
const PaymentHistory = require('../../../../models/franchisee/history/paymentHistoryModel');

// controller to get all payment history
const getAllCoupons = catchAsync(async (req, res) => {
    let coupons = await stripeService.getAllCouponFromStripe();

    // get count
    // const cQuery = new APIFeature(
    //     PaymentHistory.countDocuments(),
    //     req.query
    // ).countFilter();
    // const docCount = await cQuery.query;

    Promise.all([coupons]).then(() => {
        res.status(200).json({
            status: 'success',
            // result: docCount,
            data: coupons
        });
    });
});

const createCoupons = catchAsync(async (req, res) => {
    const { percent_off, duration, duration_in_months } = req.body

    let coupons = await stripeService
        .createCouponsInStripe({
            percent_off,
            duration,
            duration_in_months
        });

    Promise.all([coupons]).then(() => {
        res.status(200).json({
            status: 'success',
            // result: docCount,
            data: coupons
        });
    });
});

const updateCoupons = catchAsync(async (req, res) => {
    const { couponId } = req.params
    const couponObj = req.body

    let coupons = await stripeService
        .updateCouponsInStripe(couponId, couponObj);

    Promise.all([coupons]).then(() => {
        res.status(200).json({
            status: 'success',
            // result: docCount,
            data: coupons
        });
    });
});

module.exports = {
    getAllCoupons,
    createCoupons,
    updateCoupons
};
