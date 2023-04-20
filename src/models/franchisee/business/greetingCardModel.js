const slugify = require('slugify');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const greetingCardSchema = Schema(
	{
		name: {
			type: String,
			required: [true, 'A name is required'],
			trim: true
		},
		slug: String,
		image: {
			type: String,
			required: [true, 'An image is required']
		},
		businessId: {
			type: Schema.Types.ObjectId,
			ref: 'Business',
			required: [true, 'Greeting card must have a businessId']
		},
		franchiseeId: {
			type: Schema.Types.ObjectId,
			ref: 'Franchisee',
			required: [true, 'Greeting card must have a franchiseeId']
		},
		categoryIds: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Category'
			}
		],
		active: {
			type: Boolean,
			default: true
		},
		price: {
			type: Number,
			min: [0, 'Price must be more or equal to 0'],
			default: 0.0
		}
	},
	{ timestamps: true }
);

// create wildcard text indexes
greetingCardSchema.index({ '$**': 'text' });

// document Middleware
greetingCardSchema.pre('save', function (next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

const GreetingCard = mongoose.model('GreetingCard', greetingCardSchema);

module.exports = GreetingCard;
