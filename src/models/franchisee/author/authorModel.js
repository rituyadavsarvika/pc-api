const mongoose = require('mongoose');
const validator = require('validator');
const Schema = mongoose.Schema;

const authorSchema = Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'A user must have a name']
		},
		authorEmail: {
			type: String,
			trim: true,
			required: [true, 'A user must have a email'],
			lowercase: true,
			validate: {
				validator: validator.isEmail,
				message: '{VALUE} is not a valid email',
				isAsync: false
			}
		},
		socialLinks: {
			facebookLink: {
				type: String,
				trim: true,
			},
			instagramLink: {
				type: String,
				trim: true,
			},
			twitterLink: {
				type: String,
				trim: true,
			},
			youtubeLink: {
				type: String,
				trim: true,
			},
			linkedInLink: {
				type: String,
				trim: true,
			},
		},
		authorImage: {
			type: Schema.Types.ObjectId,
			ref: 'MediaContent'
		},
		authorDetails: String,
		status: {
			type: String,
			trim: true,
			upperCase: true,
			enum: ['ACTIVE', 'INACTIVE'],
			default: '',
		},
		adminType: {
			type: String,
			trim: true,
			upperCase: true,
			enum: ['SA', 'CA'],
			default: '',
			required: [true, 'A author must have a adminType']
		},
		franchiseeId: {
			type: Schema.Types.ObjectId,
			ref: 'Franchisee',
			// required: [true, 'A author must belongs to a franchisee']
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
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
);

authorSchema.virtual('label').get(function () {
	return this.name
});

authorSchema.virtual('value').get(function () {
	return this._id
});

const Author = mongoose.model('Author', authorSchema);
module.exports = Author;
