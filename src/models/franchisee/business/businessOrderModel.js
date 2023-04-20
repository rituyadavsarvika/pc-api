const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const businessOrderSchema = Schema({
	parentOrderId: {
		type: Schema.Types.ObjectId,
		ref: 'Order',
		required: [true, 'Parent Order is required']
	},
	orderNo: {
		type: String,
		required: [true, 'Order No is required'],
		trim: true,
		unique: true
	},
	orderDate: {
		type: Date,
		required: [true, 'Order date is required'],
		default: Date.now
	},
	businessId: {
		type: Schema.Types.ObjectId,
		ref: 'Business',
		required: [true, 'Business Id is required']
	},
	subTotal: {
		type: Number,
		min: [0, 'Sub Total must be more than 0'],
		required: [true, 'A order must have a subtotal']
	},
	shippingId: {
		type: Schema.Types.ObjectId,
		ref: 'ShippingMethod'
	},
	shippingCharge: {
		type: Number,
		default: 0,
		min: [0, 'Shipping charge must be more than 0']
	},
	total: {
		type: Number,
		min: [0, 'Total must be more than 0'],
		required: [true, 'A order must have a total']
	},
	products: [
		{
			_id: false,
			id: {
				type: Schema.Types.ObjectId,
				ref: 'Product',
				required: [true, 'A order must have at least 1 Product']
			},
			qty: {
				type: Number,
				required: [true, 'A product must have product qty'],
				min: [1, 'Product qty must be greater than 0']
			},
			price: {
				type: Number,
				min: [0, 'A product price must be more than 0']
			},
			greetings: {
				id: {
					type: Schema.Types.ObjectId,
					ref: 'Product'
				},
				price: {
					type: Number,
					min: [0, 'Greetings price must be greater than 0']
				},
				message: {
					type: String,
					trim: true,
					max: [200, 'Message must be less than 200']
				}
			},
			total: {
				type: Number,
				default: 0,
				min: [0, 'A product total price must be more than 0']
			}
		}
	],
	status: {
		type: String,
		required: [true, 'A order must have a status'],
		enum: [
			'PAYMENT_PENDING',
			'PROCESSING',
			'FAILED',
			'CANCELLED',
			'COMPLETE',
			'ONHOLD',
			'REFUNDED'
		],
		uppercase: true
	},
	billingAddress: {
		firstName: {
			type: String,
			trim: true,
			required: [true, 'A billing address must have a first Name']
		},
		lastName: {
			type: String,
			trim: true,
			required: [true, 'A billing address must have a last Name']
		},
		country: {
			type: String,
			default: 'United States (US)',
			required: [true, 'A billing address must have a country']
		},
		company: String,
		street: {
			type: String,
			required: [true, 'A billing address must have a street']
		},
		house: String,
		city: {
			type: String,
			required: [true, 'A billing address must have a city']
		},
		state: {
			type: String,
			required: [true, 'A billing address must have a state']
		},
		zip: {
			type: String,
			required: [true, 'A billing address must have a zip']
		},
		phone: {
			type: String,
			trim: true,
			required: [true, 'A billing address must have a phone']
		},
		email: {
			type: String,
			trim: true,
			required: [true, 'A billing address must have a email']
		}
	},
	shippingAddress: {
		firstName: {
			type: String,
			trim: true,
			required: [true, 'A shipping address must have a first Name']
		},
		lastName: {
			type: String,
			trim: true,
			required: [true, 'A shipping address must have a last Name']
		},
		country: {
			type: String,
			default: 'United States (US)',
			required: [true, 'A shipping address must have a country']
		},
		company: String,
		street: {
			type: String,
			required: [true, 'A shipping address must have a street']
		},
		house: String,
		city: {
			type: String,
			required: [true, 'A shipping address must have a city']
		},
		state: {
			type: String,
			required: [true, 'A shipping address must have a state']
		},
		zip: {
			type: String,
			required: [true, 'A shipping address must have a zip']
		},
		phone: {
			type: String,
			trim: true,
			required: [true, 'A shipping address must have a phone']
		},
		email: {
			type: String,
			trim: true,
			required: [true, 'A shipping address must have a email']
		}
	}
	// paymentStatus: {
	// 	type: String,
	// 	required: [true, 'Order Status is mandatory'],
	// 	enum: ['PAID', 'UNPAID'],
	// 	default: 'UNPAID'
	// },
});

// create wildcard text indexes
businessOrderSchema.index({ '$**': 'text' });

module.exports = mongoose.model('BusinessOrder', businessOrderSchema);
