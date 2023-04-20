const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = Schema({
	orderId: {
		type: Schema.Types.ObjectId,
		ref: 'Order',
		required: [true, 'Order id is mandatory']
	},
	paymentDate: {
		type: Date,
		required: [true, 'Payment Date is mandatory']
	},
	transactionId: {
		type: String,
		required: [true, 'Transaction id is mandatory']
	},
	paymentMethodId: String,
	amount: {
		type: Number,
		required: [true, 'Amount is mandatory']
	},
	amountCapturable: Number,
	amountReceived: Number,
	brand: String,
	last4: String,
	currency: String,
	status: String
});

module.exports = mongoose.model('Transaction', transactionSchema);
