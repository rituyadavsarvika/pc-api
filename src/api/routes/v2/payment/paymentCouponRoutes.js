const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const emailRoleMiddleware = require('../../../middlewares/emailRole.middleware');
const vendorMiddleware = require('../../../middlewares/franchisee/business/vendorMiddleware');
const subscriptionPlanMiddleware = require('../../../middlewares/franchisee/payment/subscriptionPlanMiddleware');

// import controller
const Controller = require('../../../controllers/v2/payment/paymentCouponController');
const expressBasicAuth = require('express-basic-auth');

// @route endpoint api/v1/franchisee/check_domain_is_exist
// router.route('/check_domain_is_exist').get(checkDomainIsExist);


// route to get franchisee by domain
router.route('/')
    .get(
        [
            // authMiddleware.protectRoute,
        ], Controller.getAllCoupons
    )
    .post(
        [
            // authMiddleware.protectRoute,
        ], Controller.createCoupons
    )


router.route('/:couponId')
    .patch(
        [
            // authMiddleware.protectRoute,
        ], Controller.updateCoupons
    )
// @route endpoint api/v1/franchisee/:id
// router
//     .route('/:id')
//     // .get(Controller.getFranchisee)
//     .patch(
//         [
//             authMiddleware.protectRoute,
//             franchiseeMiddleware.checkDuplicateEmail,
//             // franchiseeMiddleware.generateSlug,
//             franchiseeMiddleware.setSlugField,
//             franchiseeMiddleware.updateSubscriberConfig
//         ],
//         Controller.updateFranchisee
//     );

module.exports = router;
