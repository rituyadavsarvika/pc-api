const express = require('express');
const router = express.Router();

// Load Service
const reqService = require('./../../../../service/requestService');

// Load middleware
const authMiddleware = require('./../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');
const mediaContentMiddleware = require('./../../middlewares/media/mediaContentMiddleware');

// Load Controller
const Controller = require('./../../controllers/media/mediaContentController');

// root route
router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            reqService.parseMultipartyRequest,
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            mediaContentMiddleware.setMediaContent,
            mediaContentMiddleware.checkHostingSpace,
            mediaContentMiddleware.validateMediaType,
            mediaContentMiddleware.setAndCreatePath,
            mediaContentMiddleware.generateFileSlug,
            mediaContentMiddleware.setFileName
        ],
        Controller.uploadNew
    )
    .get(authMiddleware.protectRoute, Controller.getAllContent);

// search Media with media Type filter
router
    // .route('/search/:adminType/:mediaType*?/:searchBy*?')
    .route('/search/:adminType/:mediaType/:searchBy*?')
    .get(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.searchMedia
    );

router
    .route('/updatePath')
    .patch(
        franchiseeMiddleware.checkAdminTypeFranchiseeId,
        Controller.updatePath
    );

router
    .route('/:id')
    .get(authMiddleware.protectRoute, Controller.getContent)
    .patch([
        authMiddleware.protectRoute,
        // mediaContentMiddleware.checkHostingSpace,
    ], Controller.updateContent)
    .delete(
        [authMiddleware.protectRoute, mediaContentMiddleware.checkValidId],
        Controller.deleteContent
    );

// router to delete unused media content
router
    .route('/deleteUnused/:adminType/:franchiseeId*?')
    .delete(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.deleteUnusedMedia
    );

router
    .route('/incCount')
    .post([authMiddleware.protectRoute], Controller.incrementUseCount);

router
    .route('/decCount')
    .post([authMiddleware.protectRoute], Controller.decrementUseCount);

router
    .route('/mediaUsedDataCorrection')
    .post([authMiddleware.protectRoute], Controller.mediaUsedDataCorrection);

module.exports = router;
