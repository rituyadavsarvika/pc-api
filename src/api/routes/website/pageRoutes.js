const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const pageMiddleware = require('../../middlewares/website/pageMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const pageController = require('../../controllers/website/pageController');

// @router POST api/v1/pages/
// @desc create a new page
// @access Private, JWT token based authentication
router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            // pageMiddleware.generateSlug,
            // pageMiddleware.setSlugField
            pageMiddleware.setPageSlug
        ],
        pageController.createPage
    )
    .get(pageController.getAllPage);

// get super admin landing page route
router.route('/superAdmin').get(pageController.getSuperAdminLandingPage);
router.route('/superAdmin/new').get(pageController.getSuperAdminLandingPageNew);

router.route('/metaData').get(pageController.getAllMetaData);
router.route('/superAdmin/metaData').get(pageController.getSuperAdminLandingPageMetaData);
router.route('/cityAdmin/metaData/:franchiseeId').get(pageController.getCityAdminLandingPageMetaData);

router
    .route('/cityAdmin/:franchiseeId')
    .get(
        franchiseeMiddleware.checkValidIdMandatory,
        pageController.getCityAdminLandingPage
    );

router
    .route('/new/cityAdmin/:franchiseeId')
    .get(
        franchiseeMiddleware.checkValidIdMandatory,
        pageController.getCityAdminLandingPageNew
    );

router
    .route('/makeHome/:pageId')
    .patch(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        pageController.makeHomePage
    );

// Middleware routes
// router.use('/:id', pageMiddleware.checkValidId);

router
    .route('/:id')
    .get(pageController.getPage)
    .patch(
        [
            authMiddleware.protectRoute,
            // pageMiddleware.generateSlug,
            // pageMiddleware.setSlugField
            pageMiddleware.setPageSlug
        ],
        pageController.updatePage
    )
    .delete(
        [authMiddleware.protectRoute, pageMiddleware.checkValidId],
        pageController.deletePage
    );

module.exports = router;
