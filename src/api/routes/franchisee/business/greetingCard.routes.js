const express = require('express');
const router = express.Router();

// Load Service
const reqService = require('./../../../../../service/requestService');

// Load middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('../../../middlewares/franchisee/franchiseeMiddleware');
const vendorMiddleware = require('../../../middlewares/franchisee/business/vendorMiddleware');
const greetingMiddleware = require('../../../middlewares/franchisee/business/greetingCard.middleware');

// Load Controller
const Controller = require('../../../controllers/franchisee/business/greetingCard.controller');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            reqService.parseMultipartyRequest,
            franchiseeMiddleware.checkValidIdMandatory,
            vendorMiddleware.checkValidId
        ],
        Controller.createCard
    )
    .get(Controller.getAllCard);

router
    .route('/:id')
    .get(Controller.getCard)
    .patch(
        [authMiddleware.protectRoute, greetingMiddleware.getExistingImage],
        Controller.updateCard
    )
    .delete(authMiddleware.protectRoute, Controller.deleteCard)
    .post(
        [
            authMiddleware.protectRoute,
            reqService.parseMultipartyRequest,
            greetingMiddleware.getExistingImage
        ],
        Controller.uploadImage
    );

module.exports = router;
