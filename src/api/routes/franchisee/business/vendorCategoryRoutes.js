const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const vendorCategoryMiddleware = require('../../../middlewares/franchisee/business/vendorCategoryMiddleware');

// import controller
const Controller = require('../../../controllers/franchisee/business/vendorCategoryController');

// @route POST api/v1/businessTypes/
// @desc create businessType
// @access Private, authentication with jwt Bearer token
router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkValidIdMandatory,
            vendorCategoryMiddleware.generateSlug,
            vendorCategoryMiddleware.setSlugField
        ],
        Controller.create
    )
    .get(Controller.getVendorCategories);

// Middleware routes
router.use('/:id', vendorCategoryMiddleware.checkValidId);

router
    .route('/:id')
    .get(Controller.getVendorCategoryById)
    .patch(
        [
            authMiddleware.protectRoute,
            vendorCategoryMiddleware.generateSlug,
            vendorCategoryMiddleware.setSlugField
        ],
        Controller.updateVendorCategoryById
    );

module.exports = router;
