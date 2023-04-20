const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const googleAdSenseSchema = Schema(
	{
		adminType: {
			type: String,
			trim: true,
			upperCase: true,
			enum: ["SA", "CA"],
			default: "",
			required: [true, "AdminType is missing"],
		},
		franchiseeId: {
			type: Schema.Types.ObjectId,
			ref: "Franchisee",
		},
		content: {
			type: String,
			trim: true,
			required: [true, "Client Code is missing"],
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("GoogleAdSense", googleAdSenseSchema);
