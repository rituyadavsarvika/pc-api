const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataFormater = require('./../../utils/dataFormate');

const franchiseeSchema = Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'A franchisee must have a name']
        },
        image: {
            type: Schema.Types.ObjectId,
            ref: 'MediaContent'
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            required: [true, 'A franchisee must have a email'],
            unique: true,
            lowercase: true
        },
        address: String,
        domainKey: {
            type: String,
            required: [true, 'A franchisee must have a domainKey'],
            trim: true,
            // unique: true
        },
        domainSlug: {
            type: String,
            required: [true, 'A franchisee must have a domainSlug'],
            trim: true,
            lowercase: true,
            // unique: true
        },
        generatedDomain: {
            type: String,
            required: [true, 'System generated domain is required'],
            trim: true,
            lowercase: true,
            // unique: true
        },
        domain: {
            type: String,
            trim: true,
            lowercase: true
        },
        industryType: {
            type: String,
            trim: true
        },
        code: {
            type: String,
            trim: true,
            lowercase: true
        },
        stripeCustomerId: {
            type: String,
            select: false
        },
        stripeSubscriptionId: {
            type: String,
            select: false
        }
    },
    { timestamps: true }
);

// Pre save middleware to encrypt password
franchiseeSchema.pre('save', async function (next) {
    this.code = await dataFormater.generateUniqueNumber(8, true, true);
    next();
});

// create wildcard text indexes
franchiseeSchema.index({ '$**': 'text' });

const Franchisee = mongoose.model('Franchisee', franchiseeSchema);
module.exports = Franchisee;
