const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shippingMethodSchema = Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'Franchisee is required']
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['CA', 'BA'],
            default: 'CA',
            required: [true, 'A menu must have a adminType']
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
            // required: [true, 'Business is required']
        },
        minDays: {
            type: Number,
            default: 0,
            required: [true, 'Min estimation is required'],
            min: [1, 'Min days must be more than 0']
        },
        maxDays: {
            type: Number,
            default: 0,
            required: [true, 'Max estimation is required'],
            min: [1, 'Min days must be more than 0']
        },
        cost: {
            type: Number,
            default: 0,
            min: [0, 'Cost must be a positive number']
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
shippingMethodSchema.index({ '$**': 'text' });

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
module.exports = ShippingMethod;
