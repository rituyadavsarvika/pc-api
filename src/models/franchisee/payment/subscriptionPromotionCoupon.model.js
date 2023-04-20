const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// {
// 	-"code": "Coupon-101",
// 	"value": "11",
// 	"maxUse": "11",
// 	"name": "Coupon-101",
// 	 "max_redemptions": "11",
// 	 "redeem_by": "expireAt DATE",
// 	"amount_off": "null",
// 	"percent_off": "null",
// 	 "applies_to": "63d7a297fd52ca05255bcd0d",
// 	"descriptions": "Axasasfasdf",
// 	"type": "PERCENTAGE",
// 	"activeAt": "2023-03-07T04:38:25.155Z",
// 	"expireAt": "2023-03-08T18:00:00.000Z",
// 	"planId": "63d7a297fd52ca05255bcd0d",
// 	"isActive": true,
// 	"metadata": {
// 		"email": "jahid.prolific@gmail.com",
// 		"plan": "Premium"
// 	}
// }

// { name, code, amount_off, percent_off, max_redemptions, redeem_by, type, applies_to, active, metadata, descriptions, activeAt, expireAt, value, maxUse, planId, coupon }
const subscriptionPromotionCoupon = Schema(
	{
		name: {
			type: String,
			required: [true, 'Title is mandatory']
		},
		code: {
			type: String,
			required: [true, 'Title is mandatory']
		},
		amount_off: {
			type: Number,
			default: 0
		},
		percent_off: {
			type: Number,
			default: 0
		},
		type: String,
		max_redemptions: Number,
		redeem_by: Date,
		SubscriptionPlanIds: [{
			type: String,
			ref: 'SubscriptionPlan',
		}],
		applies_to: Array,
		active: {
			type: Boolean,
			default: false
		},
		metadata: Object,
		descriptions: String,
		promotionCodeId: String,
		couponId: String,
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'AdminType is required']
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
);

subscriptionPromotionCoupon.virtual('value').get(function () {
    return this.percent_off || this.amount_off
});

// create wildcard text indexes
subscriptionPromotionCoupon.index({ '$**': 'text' });


module.exports = mongoose.model('SubscriptionPromotionCoupon', subscriptionPromotionCoupon);
