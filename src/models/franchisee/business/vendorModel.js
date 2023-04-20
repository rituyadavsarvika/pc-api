const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorSchema = Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'Name id required']
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'Slug is required'],
            lowercase: true
        },
        image: {
            type: Schema.Types.ObjectId,
            ref: 'MediaContent'
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true
        },
        address: String,
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'VendorCategory',
                required: [true, 'Vendor category is required']
            }
        ],
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'A vendor must belongs to a business']
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
vendorSchema.index({ '$**': 'text' });

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
