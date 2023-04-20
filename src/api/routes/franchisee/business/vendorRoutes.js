const express = require('express');
const router = express.Router();

// Load middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const vendorMiddleware = require('../../../middlewares/franchisee/business/vendorMiddleware');

// Load controller
const Controller = require('../../../controllers/franchisee/business/vendorController');

// @router POST api/v1/users/business
// @desc create a new business under a specific franchisee and a new user with role businessAdmin
// @access Private, jwt authentication
router
    .route('/signup')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkValidIdMandatory,
            vendorMiddleware.generateSlug,
            vendorMiddleware.setSlugField
        ],
        Controller.vendorRegistration
    );

// @route POST api/v1/business
// @access Private, authentication with jwt bearer token
router.route('/').get(Controller.getAllVendors);

// Middleware routes
router.use('/:id', vendorMiddleware.checkValidId);

router
    .route('/:id')
    .get(Controller.getVendorById)
    .patch(
        [
            authMiddleware.protectRoute,
            vendorMiddleware.generateSlug,
            vendorMiddleware.setSlugField
        ],
        Controller.updateVendorId
    );

module.exports = router;
