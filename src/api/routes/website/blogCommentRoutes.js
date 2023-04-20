const express = require('express');
const router = express.Router();

// Load Middleware
const blogCommentMiddleware = require('./../../middlewares/website/blogCommentMiddleware');

// Load Controller
const Controller = require('./../../controllers/website/blogCommentsController');

// Create new Comment in a post
router
	.route('/')
	.post(blogCommentMiddleware.checkValidId, Controller.createComment)
	.get(Controller.getAllComment);

module.exports = router;
