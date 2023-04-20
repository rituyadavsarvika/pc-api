const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('../../controllers/website/footerController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertFooter
    )
    .get(Controller.getAllFooter);

// route to migrate footer data from old format to new format
router
    .route('/migrate')
    .post(
        [authMiddleware.protectRoute, authMiddleware.isSuperAdminUser],
        Controller.footerMigration
    );

router
    .route('/setActive/:footerId')
    .patch(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.setActive
    );

// router to get getActive footer
router.route('/getActive/:adminType/:franchiseeId*?').get(Controller.getActive);

router
    .route('/:id')
    .get(Controller.getDetails)
    .delete(
        [authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
        Controller.deleteFooter
    );

module.exports = router;
