const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product Category Schema
const categorySchema = Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'A product category must have a name']
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'A product category must have a slug'],
            lowercase: true
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Category'
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
categorySchema.index({ '$**': 'text' });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
