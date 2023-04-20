const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const keys = require('./../../../config/keys');
const Schema = mongoose.Schema;

const userSchema = Schema(
    {
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
        role: {
            type: String,
            required: [true, 'A user must have a role'],
            enum: [
                'SUPERADMIN',
                'ADMIN',
                'SUBSCRIPTIONOWNER',
                'SUBSCRIBERADMIN',
                'BUSINESSADMIN'
            ],
            uppercase: true
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
        address: {
            type: String,
            max: [100, 'Address can must be less than 100 characters']
        },
        phone: {
            type: String,
            trim: true
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        active: {
            type: Boolean,
            default: true
        },
        subscriptionInfo: {
            default: {
                type: String
            },
            subscription: [
                {
                    subscriberId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Franchisee'
                    },
                    roleId: {
                        type: String
                    }
                }
            ],
            
        },
        status: {
            type: String,
            required: [true, 'A user must have a status'],
            enum: ['SUBSCRIBED', 'PAYMENT_PENDING', 'SUBSCRIPTION_EXPIRED', 'TRIAL'],
            uppercase: true,
            trim: true
        },
        subscriptionExpireAt: Date
    },
    { timestamps: true }
);

// Pre save middleware to encrypt password
userSchema.pre('save', async function (next) {
    // if password not modified do nothing and return
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, Number(keys.BCRYPT_SALT)); // more higher will be more cpu intensive
    this.confirmPassword = undefined; // to remove confirmPassword field
    next();
});

// Instance to compare password. This function return Boolean. If both are same return true otherwise false
userSchema.methods.comparePassword = async (password, userPassword) =>
    await bcrypt.compare(password, userPassword);

/* Instance method to check if password has been changed after token issued. return Boolean. return true if password has been
changed after token issued. otherwise return false*/
userSchema.methods.changedPasswordAfterToken = function (jwtTimestamp) {
    const jwtDate = new Date(jwtTimestamp);
    if (this.passwordChangedAt) {
        const changedTimestamp = new Date(this.passwordChangedAt);
        return jwtDate < changedTimestamp;
    }
    return false;
};

// post save middleware to set passwordChangedAt
userSchema.post('save', async function (docs, next) {
    // if password not modified do nothing and return
    if (!this.isModified('password')) return next();

    this.passwordChangedAt = new Date();
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
