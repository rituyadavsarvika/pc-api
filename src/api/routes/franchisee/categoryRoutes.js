const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const categoryMiddleware = require('../../middlewares/franchisee/categoryMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('../../controllers/franchisee/categoryController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkValidIdMandatory,
            categoryMiddleware.checkValidId,
            categoryMiddleware.generateSlug,
            categoryMiddleware.setSlugField
        ],
        Controller.create
    )
    .get(Controller.getAll);

// get category by Hierarchy
router.route('/hierarchy').get(Controller.getByHierarchy);

// Middleware routes
router.use('/:id', categoryMiddleware.checkValidId);

router
    .route('/:id')
    .get(Controller.getCategory)
    .patch(
        [
            authMiddleware.protectRoute,
            categoryMiddleware.generateSlug,
            categoryMiddleware.setSlugField
        ],
        Controller.updateCategory
    );

module.exports = router;
