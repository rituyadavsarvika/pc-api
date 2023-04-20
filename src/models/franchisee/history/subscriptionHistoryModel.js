const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionHistorySchema = Schema(
    {
        subscriptionPlanId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            required: true
        },
        stripeSubscriptionId: String,
        name: {
            type: String,
            required: [true, 'A name is required'],
            trim: true
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: true
        },
        regularPrice: String,
        offerPrice: String,
        features: {
            type: Array,
            required: [true, 'Features is required']
        },
        planType: {
            type: String,
            required: [true, 'Plan type is required'],
            trim: true,
            lowercase: true,
            enum: ['monthly', 'yearly'],
            default: ''
        },
        attributes: [
            {
                _id: false,
                attributeId: {
                    type: Schema.Types.ObjectId,
                    ref: 'SubscriptionAttribute',
                    required: [true, 'AttributeId is required']
                },
                attributeType: {
                    type: String,
                    required: [true, 'Attribute Type is required'],
                    trim: true,
                    lowercase: true
                },
                value: {
                    type: Schema.Types.Mixed,
                    required: [true, 'Value is required']
                }
            }
        ],
        startAt: Date,
        nextChargeAt: Date,
        status: String,
        cancelledAt: Date
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    'SubscriptionHistory',
    subscriptionHistorySchema
);
