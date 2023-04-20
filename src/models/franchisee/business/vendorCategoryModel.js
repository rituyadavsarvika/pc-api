const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorCategorySchema = Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'Slug is required'],
            lowercase: true
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'Business is required']
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
vendorCategorySchema.index({ '$**': 'text' });

const VendorCategory = mongoose.model('VendorCategory', vendorCategorySchema);

module.exports = VendorCategory;
