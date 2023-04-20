const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionAttributeSchema = Schema(
    {
        name: {
            type: String,
            required: [true, 'A name is required'],
            trim: true
        }
    },
    { timestamps: true }
);

// create wildcard text indexes for search queries
subscriptionAttributeSchema.index(
    { name: 'text' },
    {
        name: 'TextIndex'
    }
);

module.exports = mongoose.model(
    'SubscriptionAttribute',
    subscriptionAttributeSchema
);
