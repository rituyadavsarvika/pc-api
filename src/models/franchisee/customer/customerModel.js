const mongoose = require('mongoose');
const validator = require('validator');
const keys = require('../../../../config/keys');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const customerSchema = Schema({
	firstName: {
		type: String,
		trim: true,
		required: [true, 'A user must have a name']
	},
	lastName: {
		type: String,
		trim: true
	},
	email: {
		type: String,
		trim: true,
		required: [true, 'A user must have a email'],
		unique: true,
		lowercase: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email',
			isAsync: false
		}
	},
	phone: {
		type: String,
		trim: true,
		required: [true, 'A Customer must have a phone no']
	},
	password: {
		type: String,
		required: [true, 'A user must have a password'],
		minlength: 8,
		select: false
	},
	confirmPassword: {
		type: String,
		required: [true, 'A user must have a confirmPassword'],
		validate: {
			validator: function (el) {
				return el === this.password;
			},
			message: 'Passwords are not same'
		}
	},
	passwordChangedAt: Date,
	billingAddress: {
		country: String,
		street: String,
		city: String,
		state: String,
		zip: String
	},
	shippingAddress: {
		country: String,
		street: String,
		city: String,
		state: String,
		zip: String
	},
	franchiseeId: {
		type: Schema.Types.ObjectId,
		ref: 'Franchisee',
		required: [true, 'A customer must belongs to a franchisee']
	}
});

// Pre save middleware to encrypt password
customerSchema.pre('save', async function (next) {
	// if password not modified do nothing and return
	if (!this.isModified('password')) return next();

	this.password = await bcrypt.hash(this.password, Number(keys.BCRYPT_SALT)); // more higher will be more cpu intensive
	this.confirmPassword = undefined; // to remove confirmPassword field
	next();
});

// Instance to compare password. This function return Boolean. If both are same return true otherwise false
customerSchema.methods.comparePassword = async (password, userPassword) =>
	await bcrypt.compare(password, userPassword);

/* Instance method to check if password has been changed after token issued. return Boolean. return true if password has been
changed after token issued. otherwise return false*/
customerSchema.methods.changedPasswordAfterToken = function (jwtTimestamp) {
	const jwtDate = new Date(jwtTimestamp);
	if (this.passwordChangedAt) {
		const changedTimestamp = new Date(this.passwordChangedAt);
		return jwtDate < changedTimestamp;
	}
	return false;
};

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
