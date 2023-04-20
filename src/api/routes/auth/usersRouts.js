const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../middlewares/franchisee/franchiseeMiddleware');
const emailRoleMiddleware = require('./../../middlewares/emailRole.middleware');
const subscriberConfigMiddleware = require('../../middlewares/config/subscriberConfigMiddleware');

// import controller
const authController = require('../../controllers/auth/authController');
const expressBasicAuth = require('express-basic-auth');

// @route POST api/v1/users/login
// @desc user superAdmin & cityAdmin
// @access Public, No authentication
router
    .route('/login')
    .post(
        [
            authMiddleware.checkInput,
            authMiddleware.checkDomain,
            expressBasicAuth({
                authorizer: authMiddleware.basicAuthorizer,
                unauthorizedResponse: authMiddleware.basicAuthorizerError
            })
        ],
        authController.login
    );

// @router POST api/v1/users/superAdmin
// @desc create a user with role superAdmin
// @access Private. Only Super admin can create a new super admin
router
    .route('/superAdmin')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperAdminUser,
            emailRoleMiddleware.checkDuplicateEmail,
            authMiddleware.checkDuplicateEmail
        ],
        authController.createNewAdmin
    );

// @router POST api/v1/users/cityAdmin
// @desc create a user with role cityAdmin under a franchisee
// @access Private, jwt authentication
router
    .route('/cityAdmin')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            emailRoleMiddleware.checkDuplicateEmail,
            authMiddleware.checkDuplicateEmail,
            franchiseeMiddleware.checkValidIdMandatory,
            subscriberConfigMiddleware.getSubscriberDetails
        ],
        authController.createNewSubscriberAdmin
    );

// @router POST api/v1/users/businessAdmin
// @desc create a user with role businessAdmin under a business
// @access Private, jwt authentication
// router
//     .route('/businessAdmin')
//     .post(
//         [
//             authMiddleware.protectRoute,
//             authMiddleware.isSuperOrCityAdminUser,
//             businessMiddleware.checkValidId,
//             franchiseeMiddleware.checkValidId
//         ],
//         authController.createBusinessAdmin
//     );

// route to get all users
router.route('/').get(authMiddleware.protectRoute, authController.getAllUsers);

// change password route
router
    .route('/changePassword')
    .post(authMiddleware.isUser, authController.changePassword);

// requestReset user password
router
    .route('/requestResetPassword')
    .post(
        [
            expressBasicAuth({
                authorizer: authMiddleware.basicAuthorizer,
                unauthorizedResponse: authMiddleware.basicAuthorizerError
            })
        ], authController.resetPasswordRequestController
    );

// reset user password
router.route('/passwordReset').post(authController.resetPassword);

// replace user Password without current password
router
    .route('/replacePassword')
    .post(authMiddleware.isUser, authController.replacePassword);

router
    .route('/extendSubscription')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperAdminUser,
            franchiseeMiddleware.checkValidIdMandatory
        ],
        authController.extendSubscription
    );

module.exports = router;
