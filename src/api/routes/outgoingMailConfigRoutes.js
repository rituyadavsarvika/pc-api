const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../middlewares/franchisee/franchiseeMiddleware');
const outGoingMailConfigMiddleware = require('./../middlewares/outgoingMailConfigMiddleware');

// Load Controller
const Controller = require('./../controllers/outgoingMailConfigController');

// root route
router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            // outGoingMailConfigMiddleware.checkDuplicate,
            franchiseeMiddleware.checkAdminTypeFranchiseeId
        ],
        Controller.upsertConfig
    )
    .get(authMiddleware.protectRoute, Controller.getAllConfig);

// middleware to check valid route
router.use('/:id', outGoingMailConfigMiddleware.checkValidId);

// route by id
router.route('/:id').get(authMiddleware.protectRoute, Controller.getConfig);
// .patch(authMiddleware.protectRoute, Controller.updateConfig);

module.exports = router;
