const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pinterestVerificationSchema = Schema(
    {
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'Admin Type is required']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model(
    'PinterestVerification',
    pinterestVerificationSchema
);
