const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const emailRoleRelSchema = Schema(
    {
        email: {
            type: String,
            trim: true,
            required: [true, 'email is required'],
            unique: true,
            lowercase: true,
            validate: {
                validator: validator.isEmail,
                message: '{VALUE} is not a valid email',
                isAsync: false
            }
        },
        userRole: {
            type: String,
            trim: true,
            uppercase: true,
            required: [true, 'User role is required'],
            enum: [
                'SUPERADMIN',
                'ADMIN',
                'SUBSCRIPTIONOWNER',
                'SUBSCRIBERADMIN',
                'BUSINESSADMIN',
                'CUSTOMER'
            ]
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('EmailRoleRel', emailRoleRelSchema);
