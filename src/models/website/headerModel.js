const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const headerSchema = Schema(
    {
        name: {
            type: 'string',
            trim: true,
            required: [true, 'A Footer must have a name']
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A footer must have a adminType']
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

// create wildcard text indexes
headerSchema.index({ '$**': 'text' });

const Header = mongoose.model('Header', headerSchema);
module.exports = Header;
