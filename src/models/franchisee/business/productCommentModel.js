const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productCommentsSchema = Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product id is required']
        },
        productSlug: {
            type: String,
            required: [true, 'Product slug is required']
        },
        authorName: {
            type: String,
            default: 'Unknown'
        },
        authorEmail: String,
        commentAt: {
            type: Date,
            required: [true, 'Comment date is required']
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [0, 'Rating should be more than 0'],
            max: [5, 'Rating should be less or equal 5']
        },
        message: {
            type: String,
            required: [true, 'Message is required']
        },
        reply: [Object]
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProductComment', productCommentsSchema);
