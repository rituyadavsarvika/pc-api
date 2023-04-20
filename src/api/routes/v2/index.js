const { Router } = require('express')
const router = Router()

// API V2 IMPORTS
const v2metaConfigRoutes = require('./config/metaConfigRoutes');
const v2chatConfigRoutes = require('./config/chatConfigRoutes');
const v2globalSettingsRoutes = require('./website/global/globalSettingsRoutes');
const v2FranchiseeRoutes = require('./franchisee/franchiseeRoutes');
const v2RequestTrackingRoutes = require('./requestTracking');
const v2DashboardRoutes = require('./dashboard/dashboardRoutes');
const v2AuthorRoutes = require('./blog/authorRoutes');
const v2PaymentCouponRoutes = require('./payment/paymentCouponRoutes');
const v2PaymentPromotionCodeRoutes = require('./payment/paymentPromotionCodeRoutes');


router.use('/metaConfigs', v2metaConfigRoutes);
router.use('/chatConfig', v2chatConfigRoutes);
router.use('/globalSettings', v2globalSettingsRoutes);
router.use('/franchisees', v2FranchiseeRoutes);
router.use('/requestTrack', v2RequestTrackingRoutes);
router.use('/dashboard', v2DashboardRoutes);
router.use('/authors', v2AuthorRoutes);
router.use('/payment/coupons', v2PaymentCouponRoutes);
router.use('/payment/promotion-code', v2PaymentPromotionCodeRoutes);

module.exports = router