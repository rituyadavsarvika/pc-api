const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pageSchema = Schema(
    {
        pageName: {
            type: String,
            trim: true,
            required: [true, 'A page must have a name']
        },
        pageTitle: {
            type: String,
            trim: true,
            required: [true, 'A page must have a title']
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'A slug is required'],
            lowercase: true
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'AdminType is required']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        meta: {
            description: String,
            keywords: String,
            image: {
                type: Schema.Types.ObjectId,
                ref: 'MediaContent'
            }
        },
        renderType: {
            type: String,
            trim: true,
            lowercase: true,
            enum: ['classic', 'builder'],
            required: [true, 'Render Type is Required'],
            default: 'builder'
        },
        classicId: {
            type: Schema.Types.ObjectId,
            ref: 'ClassicPage'
        },
        builderId: {
            type: Schema.Types.ObjectId,
            ref: 'PageBuilder'
        },
        isHomePage: {
            type: Boolean,
            default: false
        },
        //Status example ['draft', 'active', 'inactive']
        status: {
            type: String,
            default: 'publish',
            enum: ['publish', 'unpublish']
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
pageSchema.index({ '$**': 'text' });

const Page = mongoose.model('Page', pageSchema);
module.exports = Page;
