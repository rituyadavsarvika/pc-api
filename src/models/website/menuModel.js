const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const menuSchema = Schema(
    {
        name: {
            type: 'string',
            trim: true,
            required: [true, 'A menu must have a name']
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A menu must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        content: [Object],
        topMenu: {
            type: Boolean,
            default: false
        },
        primaryMenu: {
            type: Boolean,
            default: false
        },
        footerMenu: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
menuSchema.index({ '$**': 'text' });

const Menu = mongoose.model('Menu', menuSchema);
module.exports = Menu;
