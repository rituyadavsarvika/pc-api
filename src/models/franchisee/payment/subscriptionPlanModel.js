const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionPlanSchema = Schema(
    {
        name: {
            type: String,
            required: [true, 'A name is required'],
            trim: true
        },
        summary: {
            type: String,
            required: [true, 'A summary is required'],
            max: [100, 'Summary must be less than 100 character.']
        },
        logo: {
            type: Schema.Types.ObjectId,
            ref: 'MediaContent'
        },
        customMessage: {
            type: String,
            max: [
                50,
                'Custom message Must be less than or equal to 50 character.'
            ]
        },
        regularPrice: {
            type: String,
            set: setFloatData
        },
        offerPrice: {
            type: String,
            set: setFloatData
        },
        isFreePlan: {
            type: Boolean,
            default: false
        },
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
                    type: String,
                    required: [true, 'Value is required']
                }
            }
        ],
        publish: {
            type: Boolean,
            default: false
        },
        isCustom: {
            type: Boolean,
            default: false
        },
        isStripeConnected: {
            type: Boolean,
            default: false
        },
        stripeProductId: {
            type: String,
            select: false
        },
        stripePriceId: {
            type: String,
            select: false
        }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

function setFloatData(params) {
    if (!params) return '0.00';
    else if (params && params.toString().split('.').length === 1) {
        return `${params}.00`;
    } else return params;
}

subscriptionPlanSchema.virtual('label').get(function () {
    return this.name
});

subscriptionPlanSchema.virtual('value').get(function () {
    return this._id
});

// subscriptionPlanSchema.virtual('productId').get(function () {
//     return this.select('stripeProductId');
// });

// create wildcard text indexes
subscriptionPlanSchema.index({ '$**': 'text' });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
