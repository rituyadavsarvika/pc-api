const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = Schema(
    {
        title: {
            type: String,
            trim: true,
            max: 300,
            required: [true, 'A blog must have a title']
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'A Blog post must have a slug'],
            lowercase: true
        },
        excerpt: {
            type: String,
            max: 300,
            required: [true, 'A blog must have a excerpt']
        },
        focusKeyword: {
            type: String,
            trim: true,
        },
        focusKeywordCount: {
            type: Number,
        },
        featureImageUrl: {
            type: Schema.Types.ObjectId,
            ref: 'MediaContent'
        },
        body: String,
        tags: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Tag'
            }
        ],
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A blog must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        authorId: {
            type: Schema.Types.ObjectId,
            ref: 'Author',
            // required: [true, 'A blog must have a author']
        },
        secondaryAuthorIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Author',
            // required: [true, 'A blog must have a author']
        }],
        publish: {
            type: Boolean,
            default: false
        },
        publishedAt: Date,
        isDraft: {
            type: Boolean,
            default: false
        },

        // for SEO
        meta: {
            title: {
                type: String   
            },
            description: {
                type: String
            },
            keywords: {
                type: String
            },
            image: {
                type: Schema.Types.ObjectId,
                ref: 'MediaContent'
            }
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
blogSchema.index({ '$**': 'text' });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
