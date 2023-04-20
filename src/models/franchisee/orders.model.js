const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ordersSchema = Schema(
    {
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
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'A order must belongs to a franchisee']
        },
        subTotal: {
            type: Number,
            min: [0, 'Sub Total must be more than 0'],
            required: [true, 'A order must have a subtotal']
        },
        shippingCharge: {
            type: Number,
            min: [0, 'Shipping charge must be more than 0']
        },
        total: {
            type: Number,
            min: [0, 'Total must be more than 0'],
            required: [true, 'A order must have a total']
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
        },
        paymentMethod: {
            type: String,
            enum: ['DIGITAL', 'COD'],
            required: [true, 'A payment method is mandatory']
        },
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
        note: {
            type: String,
            max: [300, 'Note must be less than 300 characters']
        }
        // discount: {
        // 	type: Number,
        // 	default: 0,
        // 	min: [0, 'Discount must be more than 0']
        // }
        // discountBy: Object,
        // transactionId: {
        // 	type: Schema.Types.ObjectId,
        // 	ref: 'Transaction'
        // },
    },
    { timestamps: true }
);

// create wildcard text indexes
ordersSchema.index({ '$**': 'text' });

module.exports = mongoose.model('Order', ordersSchema);
