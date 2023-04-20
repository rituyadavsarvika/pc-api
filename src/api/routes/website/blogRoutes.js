const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');
const blogMiddleware = require('./../../middlewares/website/blogMiddleware');
const tagMiddleware = require('./../../middlewares/website/tagMiddleware');

// Load Controller
const Controller = require('./../../controllers/website/blogController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            blogMiddleware.validateSchedule,
            // blogMiddleware.generateSlug,
            // blogMiddleware.setSlugField
            blogMiddleware.setPageSlug
        ],
        Controller.createPost
    )
    .get(Controller.getAllPost);

// Make publish
router
    .route('/makePublish')
    .post([authMiddleware.protectRoute], Controller.makePublish);

// Get blog posts filtered by tag route
router
    .route('/tag/:tagSlug')
    .get(tagMiddleware.getIdFromSlug, Controller.getAllPost);

// Get blog posts filtered by tag list
router
    .route('/tags/:tagList')
    .get(blogMiddleware.generateTagListQuery, Controller.getAllPost);

// Get blog posts filtered by
router
    .route('/ids/:postList')
    .get(blogMiddleware.generatePostListQuery, Controller.getAllPost);

// Middleware to check valid id
router.use('/:id', blogMiddleware.checkValidId);

router
    .route('/:id')
    .get(Controller.getPost)
    .patch(
        [
            authMiddleware.protectRoute,
            blogMiddleware.validateSchedule,
            // blogMiddleware.generateSlug,
            // blogMiddleware.setSlugField
            // blogMiddleware.getExistingImage
            blogMiddleware.setPageSlug
        ],
        Controller.updatePost
    )
    .delete(authMiddleware.protectRoute, Controller.deletePost);

    router
    .route('/new/:id/:fId')
    .get(Controller.getPost)
    .patch(
        [
            authMiddleware.protectRoute,
            blogMiddleware.validateSchedule,
            // blogMiddleware.generateSlug,
            // blogMiddleware.setSlugField
            // blogMiddleware.getExistingImage
            blogMiddleware.setPageSlug
        ],
        Controller.updatePost
    )
    .delete(authMiddleware.protectRoute, Controller.deletePost);

module.exports = router;
