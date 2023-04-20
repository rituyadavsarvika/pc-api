const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pageBuilderSchema = Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'A page must have a name']
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
        content: Object,
        isTemplate: {
            type: Boolean,
            default: false
        },
        downloadCount: {
            type: Number,
            default: 0,
            min: 0
        },
        //Status example ['draft', 'active', 'inactive']
        status: {
            type: String,
            default: 'draft',
        }
    },
    { timestamps: true }
);

// create wildcard text indexes
pageBuilderSchema.index({ '$**': 'text' });

// create wildcard text indexes for search queries
pageBuilderSchema.index(
    { name: 'text' },
    {
        name: 'pageBuilderTextIndex'
    }
);

const PageBuilder = mongoose.model('PageBuilder', pageBuilderSchema);
module.exports = PageBuilder;
5