const slugify = require('slugify');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = Schema(
    {
        name: {
            type: String,
            required: [true, 'A name is required'],
            trim: true
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'A product must have a slug'],
            lowercase: true
        },
        summary: {
            type: String,
            required: [true, 'A Product must have a summary'],
            max: 300
        },
        images: {
            links: [String],
            defaultImage: {
                type: Number,
                default: 1,
                min: [0, 'Image default must be more or equal to 0']
            }
        },
        details: String,
        tags: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Tag'
            }
        ],
        categories: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category'
            }
        ],
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: [true, 'A product must have a business value']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'A Product must have a franchisee value']
        },
        shippingMethodId: {
            type: Schema.Types.ObjectId,
            ref: 'ShippingMethod'
        },
        publish: {
            type: Boolean,
            default: true
        },
        priceType: {
            type: String,
            enum: ['FIXED', 'RANGED'],
            required: [true, 'A product must have a price Type'],
            uppercase: true
        },
        price: {
            type: Number,
            min: [0, 'Price must be more or equal to 0'],
            default: 0
        },
        minPrice: {
            type: Number,
            min: [0, 'Min Price must be more or equal to 0'],
            default: 0
        },
        maxPrice: {
            type: Number,
            min: [0, 'Max price must be more or equal to 0'],
            default: 0
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
productSchema.index({ '$**': 'text' });

// document Middleware
productSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
