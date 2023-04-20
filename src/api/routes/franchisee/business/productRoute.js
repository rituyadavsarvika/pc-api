const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const vendorCategoryMiddleware = require('./../../../middlewares/franchisee/business/vendorCategoryMiddleware');
const vendorMiddleware = require('../../../middlewares/franchisee/business/vendorMiddleware');
const productMiddleware = require('../../../middlewares/franchisee/business/productMiddleware');
const tagMiddleware = require('./../../../middlewares/website/tagMiddleware');
const categoryMiddleware = require('./../../../middlewares/franchisee/categoryMiddleware');

// load request service to convert multiparty data to normal json data
const reqService = require('../../../../../service/requestService');

// Load Controller
const Controller = require('../../../controllers/franchisee/business/productController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkValidIdMandatory,
            vendorMiddleware.checkValidId,
            // productMiddleware.checkIsMultiple,
            productMiddleware.generateSlug,
            productMiddleware.setSlugField
        ],
        Controller.createProduct
    )
    .get(Controller.getAllProduct);

// router to get filter product
router.route('/filter/').post(Controller.getFilteredProduct);

// router.use('/:id', productMiddleware.checkValidId);

router.route('/slug/:slug/:franchiseeId').get(Controller.getProduct);

router
    .route('/removeImage/:id')
    .post(authMiddleware.protectRoute, Controller.removeImage);

// Get products filtered by tag route
router
    .route('/tag/:tagSlug')
    .get(tagMiddleware.getIdFromSlug, Controller.getAllProduct);

// Get products filtered by product category route
router
    .route('/productCategory/:categorySlug')
    .get(categoryMiddleware.getIdFromSlug, Controller.getAllProduct);

// Get products filtered by vendor route
router
    .route('/vendor/:vendorSlug')
    .get(vendorMiddleware.getIdFromSlug, Controller.getAllProduct);

// Get products filtered by vendor category route
router
    .route('/vendorCategory/:vendorCategorySlug')
    .get(
        [
            vendorCategoryMiddleware.getIdFromSlug,
            vendorMiddleware.getVendorListByCategory
        ],
        Controller.getAllProduct
    );

router
    .route('/:id')
    // .get(Controller.getProduct)
    .patch(
        [
            authMiddleware.protectRoute,
            productMiddleware.getExistingImage,
            productMiddleware.generateSlug,
            productMiddleware.setSlugField
        ],
        Controller.updateProduct
    )
    .post(
        [authMiddleware.protectRoute, reqService.parseMultipartyRequest],
        Controller.uploadImages
    )
    .delete(authMiddleware.protectRoute, Controller.deleteProduct);

module.exports = router;
