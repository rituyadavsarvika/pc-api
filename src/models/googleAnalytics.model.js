const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const googleAnalyticsSchema = Schema(
    {
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
		},
		code: {
			type: String,
			// required: true,
			trim: true
		},
		active: {
			type: Boolean,
			default: true
		},
		gtmCode: {
			type: String,
		},
		gtmActive: {
			type: Boolean,
			default: true
		},
		ga4Code:{
			type: String,
		},
		ga4CodeActive: {
			type: Boolean,
			default: true
		}
    },
    { timestamps: true }
);

module.exports = mongoose.model('GoogleAnalytics', googleAnalyticsSchema);
