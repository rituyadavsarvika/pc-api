// load utils
const catchAsync = require('./../../../utils/error/catchAsync');
const AppError = require('./../../../utils/error/appError');
const Validator = require('./../../../utils/validator');

// Load Model
const UserVerification = require('../../../models/auth/userVerification.model');

// middleware to get token details from email
const getTokenDetails = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const doc = await UserVerification.findOne({ email }).populate({
        path: 'userId',
        model: 'User',
        select: 'firstName'
    });

    if (Validator.isEmptyObject(doc))
        return next(
            new AppError(
                'You account is already verified or your verification period has been expired',
                200
            )
        );
    else {
        req.userId = doc.userId._id;
        req.name = doc.userId.firstName;
        next();
    }
});

module.exports = { getTokenDetails };
