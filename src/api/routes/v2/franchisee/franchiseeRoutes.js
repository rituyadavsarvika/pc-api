const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../../middlewares/franchisee/franchiseeMiddleware');
const emailRoleMiddleware = require('./../../../../api/middlewares/emailRole.middleware');
const vendorMiddleware = require('./../../../../api/middlewares/franchisee/business/vendorMiddleware');
const subscriptionPlanMiddleware = require('./../../../middlewares/franchisee/payment/subscriptionPlanMiddleware');

// import controller
const Controller = require('../../../controllers/v2/franchisee/franchiseeController');
const { checkDomainIsExist } = require('../../../../../service/franchiseeService');
const expressBasicAuth = require('express-basic-auth');

// @route endpoint api/v1/franchisee/check_domain_is_exist
// router.route('/check_domain_is_exist').get(checkDomainIsExist);


// route to get franchisee by domain
router.route('/store_name/:domain').get(
    [
        expressBasicAuth({
            authorizer: authMiddleware.basicAuthorizer,
            unauthorizedResponse: authMiddleware.basicAuthorizerError
        })
    ], Controller.getByDomain
);

// @route endpoint api/v1/franchisee/:id
router
    .route('/:id')
    // .get(Controller.getFranchisee)
    .patch(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkDuplicateEmail,
            // franchiseeMiddleware.generateSlug,
            franchiseeMiddleware.setSlugField,
            franchiseeMiddleware.updateSubscriberConfig
        ],
        Controller.updateFranchisee
    );

module.exports = router;
