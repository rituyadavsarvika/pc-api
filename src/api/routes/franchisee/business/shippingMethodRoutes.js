const express = require('express');
const router = express.Router();

// Load middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');
const ShippingMethodMiddleware = require('./../../../middlewares/franchisee/business/shippingMethodMiddleware');
const franchiseeMiddleware = require('./../../../middlewares/franchisee/franchiseeMiddleware');
const vendorMiddleware = require('./../../../middlewares/franchisee/business/vendorMiddleware');

// Load Controller
const Controller = require('../../../controllers/franchisee/business/shippingMethodController');

router
    .route('/')
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkValidIdMandatory,
            vendorMiddleware.checkConditionalValidId,
            ShippingMethodMiddleware.setDefault
        ],
        Controller.createMethod
    )
    .get(Controller.GetAllMethods);

router
    .route('/:id')
    .get(Controller.getAMethod)
    .patch(
        [authMiddleware.protectRoute, ShippingMethodMiddleware.removeIsDefault],
        Controller.updateMethod
    )
    .delete(
        [authMiddleware.protectRoute, ShippingMethodMiddleware.checkIsDefault],
        Controller.deleteMethod
    );

router
    .route('/changeDefault/:shippingId')
    .patch(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkValidId,
            ShippingMethodMiddleware.checkValidDefault
        ],
        Controller.changeDefault
    );

module.exports = router;
