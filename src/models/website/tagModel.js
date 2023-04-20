const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'A tag must have a name']
        },
        slug: {
            type: String,
            trim: true,
            required: [true, 'A tag must have a slug'],
            lowercase: true
        },
        tagType: {
            type: String,
            required: [true, 'A tag must have a type'],
            enum: ['BLOG', 'PRODUCT'],
            trim: true,
            upperCase: true
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A Tag must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        }
    },
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
);

tagSchema.virtual('label').get(function () {
	return this.name
});

tagSchema.virtual('value').get(function () {
	return this._id
});

// create wildcard text indexes
tagSchema.index({ '$**': 'text' });

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
