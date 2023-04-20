const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('../../controllers/website/headerController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertHeader
    )
    .get(Controller.getAllHeader);

// route to migrate header data from old format to new format
router
    .route('/migrate')
    .post(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.headerMigration
    );

router
    .route('/setActive/:headerId')
    .patch(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.setActive
    );

// router to get getActive header
router.route('/getActive/:adminType/:franchiseeId*?').get(Controller.getActive);

router
    .route('/:id')
    .get(Controller.getDetails)
    .delete(
        [authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
        Controller.deleteHeader
    );

module.exports = router;
