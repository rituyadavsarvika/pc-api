const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceIntegrationSchema = Schema(
    {
        subscriberId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'Subscriber is required']
        },
        serviceName: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
            lowercase: true,
            enum: ['rentmy', 'shopify']
        },
        apiKey: {
            type: String,
            required: [true, 'API key is required'],
            trim: true
        },
        secretKey: {
            type: String,
            required: [true, 'Secret key is required'],
            trim: true
        },
        storeKey: {
            type: String,
            required: [true, 'store key is required'],
            trim: true
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
serviceIntegrationSchema.index({ '$**': 'text' });

const ServiceIntegration = mongoose.model(
    'ServiceIntegration',
    serviceIntegrationSchema
);
module.exports = ServiceIntegration;
