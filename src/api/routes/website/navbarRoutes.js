const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('./../../controllers/website/navbarController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertNavbar
    )
    .get(Controller.getAllNavbar);

router
    .route('/search/')
    .post(
        [authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
        Controller.searchNavbar
    );

router
    .route('/setActive/:navbarId')
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
    .route('/:navbarId')
    .get(Controller.getDetailsById)
    .delete(
        [authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
        Controller.deleteById
    );

module.exports = router;
