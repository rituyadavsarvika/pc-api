const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');
const paymentMiddleware = require('./../../../middlewares/franchisee/payment/paymentMiddleware');
const franchiseeMiddleware = require('./../../../middlewares/franchisee/franchiseeMiddleware');
const subscriptionPlanMiddleware = require('./../../../middlewares/franchisee/payment/subscriptionPlanMiddleware');
const subscriberConfigMiddleware = require('../../../middlewares/config/subscriberConfigMiddleware');
const SubscriptionHistoryMiddleware = require('./../../../middlewares/franchisee/history/subscriptionMiddleware');

// Load Controller
const Controller = require('../../../controllers/franchisee/payment/paymentController');

router
    .route('/')
    .get(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.getAllPayments
    );

router
    .route('/:paymentHistoryId')
    .get(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.getPaymentDetails
    );

router
    .route('/subscriptionPlanPayment')
    .post(
        [
            franchiseeMiddleware.checkValidIdMandatory,
            subscriptionPlanMiddleware.isValidId,
            subscriptionPlanMiddleware.CheckIfStripeConnected
        ],
        Controller.makeSubscriptionPayment
    );

router
    .route('/retakeSubscription')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSubscriptionOwner,
            franchiseeMiddleware.checkValidIdMandatory,
            subscriptionPlanMiddleware.isValidId,
            subscriberConfigMiddleware.getSubscriberDetails
        ],
        Controller.retakeSubscription
    );

router
    .route('/upgradeSubscription')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSubscriptionOwner,
            franchiseeMiddleware.checkValidIdMandatory,
            subscriptionPlanMiddleware.isValidId,
            subscriberConfigMiddleware.getSubscriberDetails,
            subscriptionPlanMiddleware.isPlanDowngrade,
            SubscriptionHistoryMiddleware.checkByStripeSubscriptionBy
        ],
        Controller.upgradeSubscriberSubscription
    );

router
    .route('/paymentMethods')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSubscriptionOwner,
            paymentMiddleware.checkValidInput
        ],
        Controller.attachedPaymentMethodWithCustomer
    )
    .patch(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSubscriptionOwner,
            franchiseeMiddleware.checkValidIdMandatory
        ],
        Controller.setDefaultPaymentMethod
    );

// router
//     .route('/:customerId')
//     .get([authMiddleware.protectRoute], Controller.getAllPayments);

router
    .route('/paymentMethods/customer/:customerId')
    .get(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.getCustomerWisePaymentMethods
    );

router
    .route('/paymentMethods/test')
    .post(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.addNewPaymentMethod
    );

router
    .route('/paymentMethods/:id')
    .patch(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.setDefaultPaymentMethod
    )
    .get(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.retrievePaymentMethod
    );

router
    .route('/invoice/:invoiceId')
    .get(
        [authMiddleware.protectRoute, authMiddleware.isSubscriptionOwner],
        Controller.retrieveInvoice
    );

module.exports = router;
