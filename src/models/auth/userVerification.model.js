const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const keys = require('./../../../config/keys');
const Schema = mongoose.Schema;

const userVerificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            trim: true
        },
        token: {
            type: String,
            required: true
        }
        // createdAt: {
        //     type: Date,
        //     default: Date.now,
        //     index: { expires: '2d' }
        //     //? TODO have to set expires dynamically from subscriber config model
        // }
    },
    { timestamps: true }
);

// userVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });
userVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 });

// Pre save middleware to encrypt token
userVerificationSchema.pre('save', async function (next) {
    // if token not modified do nothing and return
    if (!this.isModified('token')) return next();

    this.token = await bcrypt.hash(this.token, Number(keys.BCRYPT_SALT));
    next();
});

// Instance to compare token. This function return Boolean. If both are same return true otherwise false
userVerificationSchema.methods.compareToken = async (token, userToken) =>
    await bcrypt.compare(token, userToken);

module.exports = mongoose.model('UserVerification', userVerificationSchema);
