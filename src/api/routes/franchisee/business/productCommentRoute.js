const express = require('express');
const router = express.Router();

// Load Middleware
const productCommentMiddleware = require('../../../middlewares/franchisee/business/productCommentMiddleware');

// Load Controller
const Controller = require('../../../controllers/franchisee/business/productCommentController');

// Create new Comment in a post
router
    .route('/')
    .post(productCommentMiddleware.checkValidId, Controller.createNewComment)
    .get(Controller.getAllComment);

module.exports = router;
