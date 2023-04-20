const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');

// Load Controller
const Controller = require('./../../../controllers/franchisee/payment/subscriptionAttributeController');

router
    .route('/')
    .post(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.createSubscriptionAttribute
    )
    .get(Controller.getAllSubscriptionAttributes);

router
    .route('/:id')
    .get(Controller.getSubscriptionAttributeById)
    .patch(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.updateSubscriptionAttributeById
    )
    .delete(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.deleteSubscriptionAttribute
    );

module.exports = router;
