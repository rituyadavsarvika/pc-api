const express = require('express');
const router = express.Router();

// load middleware
const authMiddleware = require('../../../middlewares/auth/authMiddleware');
const subscriberMiddleware = require('./../../../middlewares/franchisee/franchiseeMiddleware');
const serviceIntegrationMiddleware = require('./../../../middlewares/franchisee/integration/serviceIntegrationMiddleware');

// load Controller
const Controller = require('./../../../controllers/franchisee/integration/serviceIntegrationController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            subscriberMiddleware.checkValidIdMandatory,
            serviceIntegrationMiddleware.checkIsMultiple
        ],
        Controller.createNewService
    )
    .get(Controller.getAllService);

router
    .route('/rentmyToken')
    .post(
        [
            authMiddleware.protectRoute,
            serviceIntegrationMiddleware.getBySubscriberId
        ],
        Controller.getRentmyToken
    );

router
    .route('/:serviceId')
    .get([authMiddleware.protectRoute], Controller.getServiceById)
    .patch(
        [
            authMiddleware.protectRoute,
            serviceIntegrationMiddleware.checkIsMultiple
        ],
        Controller.updateServiceById
    )
    .delete([authMiddleware.protectRoute], Controller.deleteServiceById);

module.exports = router;
