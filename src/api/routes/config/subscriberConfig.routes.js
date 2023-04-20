const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../middlewares/franchisee/franchiseeMiddleware');

// load Controller
const Controller = require('../../controllers/config/subscriberConfigController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertData
    )
    .get(Controller.getAllConfig);

router.route('/:id').get(Controller.getConfig);

module.exports = router;
