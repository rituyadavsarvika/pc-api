const express = require('express');
const router = express.Router();

// Load Controller
const Controller = require('./../../controllers/auth/accountVerifyController');

// Load Middleware
const AccountVerificationMiddleware = require('./../../middlewares/auth/accountVerificationMiddleware');

router.route('/verify-account').get(Controller.verifyAccount);

// route to resend verification code
router
    .route('/resend-verify-code')
    .post(
        AccountVerificationMiddleware.getTokenDetails,
        Controller.resendVerificationCode
    );

module.exports = router;
