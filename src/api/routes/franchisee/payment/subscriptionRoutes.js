const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');
const SubscriptionHistoryMiddleware = require('./../../../middlewares/franchisee/history/subscriptionMiddleware');
const SubscriptionPlanMiddleware = require('./../../../middlewares/franchisee/payment/subscriptionPlanMiddleware');

// Load Controller
const Controller = require('./../../../controllers/franchisee/payment/subscriptionController');

router
    .route('/')
    .get(
        [authMiddleware.protectRoute],
        Controller.getAllSubscriptionByCustomer
    );

router
    .route('/:subscriptionId')
    .get([authMiddleware.protectRoute], Controller.getSubscriptionById)
    .delete(
        [
            authMiddleware.protectRoute,
            SubscriptionHistoryMiddleware.isValidId,
            SubscriptionPlanMiddleware.isValidId
        ],
        Controller.cancelSubscription
    );

router
    .route('/dataCorrection')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperAdminUser,
            SubscriptionPlanMiddleware.getFreePlan,
            SubscriptionPlanMiddleware.isValidId
        ],
        Controller.dataCorrection
    );

module.exports = router;
