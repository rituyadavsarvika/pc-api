const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriberConfigSchema = Schema(
    {
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A mail config must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        systemDomain: {
            isSslActive: {
                type: Boolean,
                default: false
            },
            sslExpireAt: {
                type: Date,
                default: null
            }
        },
        customDomain: {
            domain: String,
            isServerConfigCreated: {
                type: Boolean,
                default: false
            },
            isARecordCreated: {
                type: Boolean,
                default: false
            },
            isSslActive: {
                type: Boolean,
                default: false
            },
            sslExpireAt: {
                type: Date,
                default: null
            },
            updatedBy: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                default: null
            },
        },
        subscriptionPlanId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            select: false,
            required: [true, 'Subscription Plan is required']
        },
        subscriptionTakenAt: {
            type: Date,
            default: new Date()
        },
        subscriptionExpireAt: {
            type: Date,
            required: [true, 'Subscription Expire at is required']
        },
        planType: {
            type: String,
            required: [true, 'Plan type is required']
        },
        planPrice: {
            type: String,
            set: setFloatData
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
        spaceUsages: {
            type: Number,
            default: 0.0
        }, // size in Byte. to convert in MB you have divide (example spaceUsages / 1000 / 1000)
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
    },
    { timestamps: true }
);

function setFloatData(params) {
    if (!params) return '0.00';
    else if (params && params.toString().split('.').length === 1) {
        return `${params}.00`;
    } else return params;
}

// create wildcard text indexes
subscriberConfigSchema.index({ '$**': 'text' });

const SubscriberConfig = mongoose.model(
    'SubscriberConfig',
    subscriberConfigSchema
);
module.exports = SubscriberConfig;
