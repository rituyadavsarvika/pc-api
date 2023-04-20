const express = require('express');
const router = express.Router();

// import middleware
const tokenMiddleware = require('../../middlewares/auth/tokenMiddleware');

// import controller
const Controller = require('../../controllers/auth/tokenController');

router
	.route('/verify')
	.post(tokenMiddleware.decodeToken, Controller.verifyToken);

module.exports = router;
