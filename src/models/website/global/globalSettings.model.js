const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const globalSettingsSchema = Schema(
    {
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            required: [true, 'Global Settings must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        title: {
            type: String,
            trim: true,
            required: [true, 'Global Settings must have a title']
        },
        brand: {
            type: String,
            trim: true,
            required: [true, 'Global Settings must have a brand']
        },
        logo: {
            type: Schema.Types.ObjectId,
            ref: 'MediaContent'
        },
        favicon: {
            type: Schema.Types.ObjectId,
            ref: 'MediaContent'
        },
        theme: {
            color: {
                primary: {
                    type: String,
                    trim: true,
                    required: [true, 'Primary Color is required'],
                    default: '#916BBF'
                },
                secondary: {
                    type: String,
                    trim: true,
                    required: [true, 'secondary Color is required'],
                    default: '#C996CC'
                },
                accent: {
                    type: String,
                    trim: true,
                    required: [true, 'accent Color is required'],
                    default: '#1C0C5B'
                }
            },
            font: String
        },
        pReview: {
            type: Boolean,
            default: false
        },
        showShop: {
            type: Boolean,
            default: true
        },
        showBlog: {
            type: Boolean,
            default: true
        },
        showSignIn: {
            type: Boolean,
            default: true
        },
        shopLayout: {
            type: String,
            enum: ['DEFAULT', 'CUSTOM'],
            default: 'DEFAULT',
            required: [true, 'Shop layout is required'],
            upperCase: true,
            trim: true
        }
        // homePageId: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'Page'
        // }
    },
    { timestamps: true }
);

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
