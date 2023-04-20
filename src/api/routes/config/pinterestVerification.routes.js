const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('./../../controllers/config/pinterestVerificationController');

// root route
router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            authMiddleware.isSuperOrCityAdminUser,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertData
    )
    .get(Controller.getAll);

// route by id
router.route('/:id').get(Controller.getById);

module.exports = router;
