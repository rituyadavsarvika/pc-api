const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = Schema(
    {
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'A coupon must belongs to a franchisee']
        },
        code: {
            type: String,
            required: [true, 'Coupon code is required'],
            trim: true,
            uppercase: true
        },
        couponType: {
            type: String,
            required: [true, 'Coupon type is required'],
            uppercase: true,
            enum: ['FIXED', 'PERCENTAGE']
        },
        value: {
            type: Number,
            required: [true, 'Value is required'],
            min: [0, `Value must be more than zero ('0')`]
        },
        activeAt: {
            type: Date,
            required: [true, 'Active from is required']
        },
        expireAt: {
            type: Date,
            required: [true, 'Expire at is required']
            // validate: {
            // 	validator: function (el) {
            // 		return el > this.activeAt;
            // 	},
            // 	message: 'Expire At must be after activeAt'
            // }
        },
        maxUse: {
            type: Number,
            default: 1,
            required: [true, 'Max use is required']
        },
        usedCount: {
            type: Number,
            min: 0,
            default: 0
        },
        descriptions: String
    },
    { timestamps: true }
);

// create wildcard text indexes
couponSchema.index({ '$**': 'text' });

module.exports = mongoose.model('Coupon', couponSchema);
