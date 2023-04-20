const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');
const SubscriptionPlanMiddleware = require('./../../../middlewares/franchisee/payment/subscriptionPlanMiddleware');

// Load Controller
const Controller = require('./../../../controllers/franchisee/payment/subscriptionPlanController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperAdminUser,
            SubscriptionPlanMiddleware.setFreePlan,
            SubscriptionPlanMiddleware.checkIsMultipleFreePlan
        ],
        Controller.createSubscriptionPlan
    )
    .get(Controller.getAllSubscriptionPlan);

router.route('/adminPlan').get(Controller.getAllAdminPlan);

router
    .route('/:id')
    .get(Controller.getSubscriptionPlanById)
    .patch(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperAdminUser,
            SubscriptionPlanMiddleware.isValidId,
            SubscriptionPlanMiddleware.setFreePlan
        ],
        Controller.updateSubscriptionPlanById
    )
    .delete(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.deleteSubscriptionPlan
    )
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperAdminUser,
            SubscriptionPlanMiddleware.isValidId
        ],
        Controller.connectStripeProductByPlanId
    );

module.exports = router;
