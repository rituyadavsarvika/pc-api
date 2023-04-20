const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('../../../controllers/v2/config/metaConfigController');

// root route
router
    .route('/')
    .get(Controller.getMetaConfigs);

// route by id
// router.route('/:id').get(Controller.getById);

module.exports = router;
