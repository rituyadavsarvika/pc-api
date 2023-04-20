const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');

// import controller
const Controller = require('../../../controllers/v2/blog/authorController');
// const expressBasicAuth = require('express-basic-auth');


// @route endpoint api/v2/blog/author
router
    .route('/')
    .get(
        [
            authMiddleware.protectRoute,
        ], Controller.getAuthors
    )
    .post(
        [
            authMiddleware.protectRoute,
        ], Controller.createAuthor
    )

// @route endpoint api/v2//blog/author/:authorId
router
    .route('/:id')
    .get(
        [
            authMiddleware.protectRoute,
        ], Controller.getAuthorById
    )
    .patch(
        [
            authMiddleware.protectRoute,
        ], Controller.updateAuthor
    )

module.exports = router;
