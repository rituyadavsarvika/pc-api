const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentHistorySchema = Schema(
    {
        subscriberId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            required: [true, 'Subscriber is missing']
        },
        subscriptionPlanId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriberConfig',
            required: [true, 'Subscription Plan is missing']
        },
        subscriptionHistoryId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionHistory'
        },
        paymentDate: {
            type: Date,
            required: [true, 'Payment date is missing']
        },
        paymentIntentId: String,
        amount: Number,
        chargeId: String,
        status: String,
        invoice: {
            invoiceId: String,
            invoiceNo: String,
            invoiceDownloadURL: String,
            hostedInvoiceURL: String
        },
        paymentMethod: {
            last4Digit: String,
            brand: String,
            exp_month: String,
            exp_year: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
