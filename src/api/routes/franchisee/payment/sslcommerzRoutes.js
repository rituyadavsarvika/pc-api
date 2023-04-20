const express = require('express');
const router = express.Router();

// Load Controller
const Controller = require('./../../../controllers/franchisee/payment/sslcommerzController');

router.route('/').post(Controller.sslcommerzInitiate);

// router.route('/initiate').get(Controller.sslcommerzInitiateTest);

router.route('/ipn').post(Controller.ipn);

router.route('/success').post(Controller.paymentSuccess);
router.route('/cancel').post(Controller.paymentCancel);
router.route('/fail').post(Controller.paymentFail);

router.route('/status/:status').post(Controller.APIStatus);

module.exports = router;
