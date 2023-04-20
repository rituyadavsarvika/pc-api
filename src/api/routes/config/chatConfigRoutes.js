const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('./../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');
const chatConfigMiddleware = require('./../../middlewares/config/chatConfigMiddleware');

// load Controller
const Controller = require('./../../controllers/config/chatConfigController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            chatConfigMiddleware.checkIsMultiple
        ],
        Controller.CreateChatConfig
    )
    .get(Controller.getAllChatConfig);

router
    .route('/:id')
    .get(Controller.getChatConfig)
    .patch(authMiddleware.protectRoute, Controller.updateChatConfig);

module.exports = router;
