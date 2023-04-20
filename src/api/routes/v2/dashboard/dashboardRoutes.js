const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const emailRoleMiddleware = require('../../../middlewares/emailRole.middleware');
const vendorMiddleware = require('../../../middlewares/franchisee/business/vendorMiddleware');
const subscriptionPlanMiddleware = require('../../../middlewares/franchisee/payment/subscriptionPlanMiddleware');

// import controller
const Controller = require('../../../controllers/v2/dashboard/dashboardController');
const expressBasicAuth = require('express-basic-auth');


// @route endpoint api/v1/dashboard/activity/overview/:id
router
    .route('/activity/overview/:id')
    .get(
        [
            authMiddleware.protectRoute,
            // franchiseeMiddleware.checkAdminTypeFranchiseeId,
        ], Controller.getActivityOverview
    )

// @route endpoint api/v1/dashboard/activity/overview/:id
router
    .route('/tour/config/:id')
    .get(
        [
            authMiddleware.protectRoute,
            // franchiseeMiddleware.checkAdminTypeFranchiseeId,
        ], Controller.getTourConfig
    )
    .patch(
        [
            authMiddleware.protectRoute,
            // franchiseeMiddleware.checkAdminTypeFranchiseeId,
        ], Controller.updateTourConfig
    )

module.exports = router;
