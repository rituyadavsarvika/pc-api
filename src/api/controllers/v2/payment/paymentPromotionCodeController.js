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
const SubscriptionPromotionCouponModel = require('../../../../models/franchisee/payment/subscriptionPromotionCoupon.model');

// controller to get all payment history
const getAllPromotions = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        SubscriptionPromotionCouponModel.find(),
        // .populate({
        //     path: 'logo',
        //     model: 'MediaContent',
        //     select: 'filePath altText'
        // }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const couponList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        SubscriptionPromotionCouponModel.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([couponList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: couponList
        });
    });
});

// controller to get all payment history
const getAllPromotionCode = catchAsync(async (req, res) => {
    let promotionalCode = await stripeService.getAllPromotionCodeFromStripe();

    // get count
    // const cQuery = new APIFeature(
    //     PaymentHistory.countDocuments(),
    //     req.query
    // ).countFilter();
    // const docCount = await cQuery.query;

    Promise.all([promotionalCode]).then(() => {
        res.status(200).json({
            status: 'success',
            // result: docCount,
            data: promotionalCode
        });
    });
});

const createPromotionCode = catchAsync(async (req, res) => {
    const { name, code, amount_off, percent_off, max_redemptions, redeem_by, type, applies_to, active, metadata, descriptions, activeAt, expireAt, value, maxUse, planId, coupon } = req.body
    const duration_in_months = 1;

    let createCouponObj = {
        name,
        metadata,
        duration: 'forever',
        // duration_in_months,
        // max_redemptions,
        // redeem_by: (new Date(redeem_by).valueOf() / 1000),
        // applies_to: {
        //     products: applies_to
        // },
    }

    if (type == 'PERCENTAGE') {
        createCouponObj['percent_off'] = percent_off || 0
    }
    else if (type == 'FIXED') {
        createCouponObj['amount_off'] = amount_off || 0
        createCouponObj['currency'] = 'USD'
    }

    if (max_redemptions) {
        createCouponObj['max_redemptions'] = max_redemptions
    }

    if (redeem_by) {
        createCouponObj['redeem_by'] = (new Date(redeem_by).valueOf() / 1000)
    }

    if (applies_to && applies_to?.length) {
        Object.assign(createCouponObj, { applies_to: { products: applies_to } })
        // createCouponObj['applies_to'].products = applies_to
    }

    console.log("createCouponObj:::", createCouponObj);

    let couponId = null
    stripeService
        .createCouponsInStripe(createCouponObj)
        .then(async couponObj => {
            couponId = couponObj?.id
            console.log("couponObj:::", couponObj);
            let promotionCodeObj = {
                coupon: couponObj?.id,
                code,
                metadata,
                active,
                max_redemptions
            }

            console.log("promotionCodeObj:::", promotionCodeObj);

            let promotionObj = await stripeService
                .createPromotionCodeInStripe(promotionCodeObj);

            console.log("promotionObj:::", promotionObj);

            return { couponObj, promotionObj }
        })
        .then(async ({ couponObj, promotionObj }) => {

            req.body['promotionCodeId'] = promotionObj?.id
            req.body['couponId'] = promotionObj?.coupon?.id
            req.body['SubscriptionPlanIds'] = applies_to
            req.body['adminType'] = 'SA'

            const subscriptionPromotionCouponModel = await SubscriptionPromotionCouponModel.create(req.body)

            console.log("couponObj, promotionObj:::", couponObj, promotionObj);
            console.log("subscriptionPromotionCouponModel:::", subscriptionPromotionCouponModel);

            Promise.all([couponObj, promotionObj, subscriptionPromotionCouponModel]).then(() => {
                res.status(200).json({
                    status: 'success',
                    data: { couponObj, promotionObj, subscriptionPromotionCouponModel }
                });
            });
        })
        .catch(err => {
            stripeService
                .deletePromotionCodeInStripe(couponId)
                .catch(err => err)

            res.status(500).json({
                status: 'failed',
                message: `${err?.message}`
            });
        });

});

const updatePromotionCode = catchAsync(async (req, res) => {
    const { promotionCodeId } = req.params
    const promotionCodeObj = req.body
    const { name, active, metadata } = req.body

    const subscriptionPromotionCouponObj = await SubscriptionPromotionCouponModel
        .findByIdAndUpdate(promotionCodeId, { $set: promotionCodeObj })

    let coupons = null
    if (name) {
        coupons = await stripeService
            .updateCouponsInStripe(subscriptionPromotionCouponObj?.couponId, { name, metadata });
    }

    let promotionalCode = null
    if (active && !metadata) {
        promotionalCode = await stripeService
            .updatePromotionCodeInStripe(subscriptionPromotionCouponObj?.promotionCodeId, { active });
    }
    else if (active && metadata) {
        promotionalCode = await stripeService
            .updatePromotionCodeInStripe(subscriptionPromotionCouponObj?.promotionCodeId, { active, metadata });
    }

    Promise.all([subscriptionPromotionCouponObj, coupons, promotionalCode]).then(() => {
        res.status(200).json({
            status: 'success',
            // result: docCount,
            data: { subscriptionPromotionCouponObj, coupons, promotionalCode }
        });
    });
});

const retrivePromotionCode = catchAsync(async (req, res) => {
    const { promotionCodeId } = req.params

    const subscriptionPromotionCouponObj = await SubscriptionPromotionCouponModel.findById(promotionCodeId)

    const promotionalCode = await stripeService
        .retrivePromotionCodeInStripe(subscriptionPromotionCouponObj?.promotionCodeId);

    Promise.all([promotionalCode]).then(() => {
        res.status(200).json({
            status: 'success',
            // result: docCount,
            data: { subscriptionPromotionCouponObj, promotionalCode }
        });
    });
});

const deletePromotionCode = catchAsync(async (req, res) => {
    const { promotionCodeId } = req.params

    let promotionalCode = null
    let subscriptionPromotionCouponDelete = null
    const subscriptionPromotionCouponModel = await SubscriptionPromotionCouponModel.findById(promotionCodeId)
    SubscriptionPromotionCouponModel
        .findByIdAndDelete(promotionCodeId)
        .then(async (delRes) => {
            console.log("delRes:::", delRes);
            subscriptionPromotionCouponDelete = delRes

            if (subscriptionPromotionCouponModel?.couponId) {
                promotionalCode = await stripeService
                    .deletePromotionCodeInStripe(subscriptionPromotionCouponModel?.couponId)
                    .catch(err => err)
            }

            return { subscriptionPromotionCouponDelete, promotionalCode }

        })
        .then(({ subscriptionPromotionCouponDelete, promotionalCode }) => {

            Promise.all([subscriptionPromotionCouponDelete, promotionalCode]).then(() => {
                res.status(200).json({
                    status: 'success',
                    // result: docCount,
                    data: { subscriptionPromotionCouponDelete, promotionalCode }
                });
            })
        })
        .catch(err => {
            res.status(500).json({
                status: 'failed',
                message: `${err}`
            });
        });



});

module.exports = {
    getAllPromotions,
    getAllPromotionCode,
    createPromotionCode,
    updatePromotionCode,
    retrivePromotionCode,
    deletePromotionCode
};
