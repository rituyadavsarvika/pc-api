const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const tagMiddleware = require('./../../middlewares/website/tagMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('./../../controllers/website/tagController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            tagMiddleware.generateSlug,
            tagMiddleware.setSlugField
        ],
        Controller.createTag
    )
    .get(Controller.getAllTag);

router
    .route('/:id')
    .get(Controller.getTag)
    .patch(
        [
            authMiddleware.protectRoute,
            tagMiddleware.generateSlug,
            tagMiddleware.setSlugField
        ],
        Controller.updateTag
    )
    .delete(authMiddleware.protectRoute, Controller.deleteTag);

module.exports = router;
