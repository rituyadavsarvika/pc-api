const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const navbarSchema = Schema(
    {
        name: {
            type: 'string',
            trim: true,
            required: [true, 'Name is missing!']
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'AdminType is missing!']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        content: Object,
        isTemplate: {
            type: Boolean,
            default: false
        },
        active: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Navbar', navbarSchema);
