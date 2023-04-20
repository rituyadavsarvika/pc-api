const express = require('express');
const router = express.Router();

// Load service
const reqService = require('../../../service/requestService');

// Load Middleware
const formMiddleware = require('../middlewares/formMiddleware');
const franchiseeMiddleware = require('./../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('../controllers/formController');

router.route('/').post(
    [
        reqService.parseMultipartyRequest,
        formMiddleware.validateData,
        franchiseeMiddleware.checkAdminTypeFranchiseeId,
        formMiddleware.generateAttachments
        // formMiddleware.getToEmail
    ],
    Controller.sendContactMail
);
module.exports = router;
