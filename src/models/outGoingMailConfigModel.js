const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const outGoingMailConfigSchema = Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'A mail config must have a name']
        },
        smtpHost: {
            // label will be SMTP Server
            type: String,
            trim: true,
            required: [true, 'A mail config must have a host']
        },
        smtpPort: {
            // label will be smtp port
            type: Number,
            required: [true, 'A mail config must have a port'],
            min: [0, 'A mail config port must be more that 0']
        },
        smtpEncryption: {
            // label will be Connection Security
            type: String,
            enum: ['NONE', 'AUTO', 'SSL', 'TLS', 'STARTTLS'],
            uppercase: true
        },
        smtpUser: {
            type: String,
            trim: true
        },
        smtpPass: {
            type: String,
            trim: true,
            select: false
        },
        active: {
            type: Boolean,
            default: true
        },
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A mail config must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        }
    },
    { timestamps: true }
);

const OutgoingMailConfig = mongoose.model(
    'OutgoingMailConfig',
    outGoingMailConfigSchema
);
module.exports = OutgoingMailConfig;
