const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const couponMiddleware = require('./../../middlewares/franchisee/coupon.middleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');

// Load Controller
const Controller = require('./../../controllers/franchisee/coupon.controller');

/**
 * @route root endpoint of coupons '/'
 * @description 2 API (Create and get all) are associated with this route separated by HTTP Method
 */
router
	.route('/')
	.post(
		[
			authMiddleware.protectRoute,
			authMiddleware.isSuperOrCityAdminUser,
			franchiseeMiddleware.checkValidIdMandatory,
			couponMiddleware.checkDuplicate
		],
		Controller.createNew
	)
	.get(
		[authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
		Controller.getAllCoupons
	);

// route to get by coupon code
router.route('/applyCoupon').post(Controller.applyCoupon);

router
	.route('/:id')
	.get(
		[authMiddleware.protectRoute, authMiddleware.isSuperOrCityAdminUser],
		Controller.getCouponById
	)
	.patch(
		[
			authMiddleware.protectRoute,
			authMiddleware.isSuperOrCityAdminUser,
			couponMiddleware.getUsedCount
		],
		Controller.updateCoupon
	)
	.delete(authMiddleware.protectRoute, Controller.deleteCoupon);

module.exports = router;
