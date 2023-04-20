const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const keys = require('./../../../config/keys');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: 'user'
	},
	token: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now,
		index: { expires: '1d' }
	}
});

// Pre save middleware to encrypt token
tokenSchema.pre('save', async function (next) {
	// if token not modified do nothing and return
	if (!this.isModified('token')) return next();

	this.token = await bcrypt.hash(this.token, Number(keys.BCRYPT_SALT));
	next();
});

// Instance to compare token. This function return Boolean. If both are same return true otherwise false
tokenSchema.methods.compareToken = async (token, userToken) =>
	await bcrypt.compare(token, userToken);

module.exports = mongoose.model('Token', tokenSchema);
