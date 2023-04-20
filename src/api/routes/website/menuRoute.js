const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('../../controllers/website/menuController');

// router
//     .route('/by/:slug')
//     .get(
//         [
//             authMiddleware.protectRoute
//         ],
//         Controller.findMenuBySlug
//     )

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.createMenu
    )
    .get(Controller.getAllMenu);

router.route('/assignMenu/:menuId').patch(
    [
        authMiddleware.protectRoute,
        franchiseeMiddleware.checkAdminTypeFranchiseeId
        // ShippingMethodMiddleware.checkValidDefault
    ],
    Controller.changePosition
);

router
    .route('/:id')
    .get(Controller.getMenu)
    .patch(
        [authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
        Controller.updateMenu
    )
    .delete(authMiddleware.protectRoute, Controller.deleteMenu);

module.exports = router;
