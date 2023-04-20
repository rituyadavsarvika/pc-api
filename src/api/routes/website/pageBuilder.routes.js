const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');
const pageBuilderMiddleware = require('../../middlewares/website/pageBuilderMiddleware');

// Load Controller
const Controller = require('../../controllers/website/pageBuilderController');

// @router POST api/v1/pages/
// @desc create a new page
// @access Private, JWT token based authentication
router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertBuilder
    )
    .get(Controller.getAll);

router
    .route('/migrate')
    .post(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.pageBuilderMigration
    );

router
    .route('/:id')
    .get(Controller.getDetails)
    .patch(Controller.IncrementDownloadCount)
    .delete(authMiddleware.protectRoute, Controller.deleteById);

router
    .route('/updateMediaUrl')
    .patch(
        franchiseeMiddleware.checkAdminTypeFranchiseeId,
        Controller.updateMediaPath
    );

router
    .route('/useTemplate')
    .post(
        [
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            pageBuilderMiddleware.useTemplate
        ],
        Controller.replaceMediaPath
    );

router
    .route('/search/')
    .post([authMiddleware.protectRoute], Controller.searchPageTemplate);

module.exports = router;
