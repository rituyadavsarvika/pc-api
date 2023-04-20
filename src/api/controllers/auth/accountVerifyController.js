const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const CONFIG = require('./../../../../config/keys');

// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const AppError = require('../../../utils/error/appError');
const Validator = require('../../../utils/validator');

// load service`
const SendMailService = require('../../../../service/sendMail');

// Load Model
const UserVerification = require('../../../models/auth/userVerification.model');
const User = require('./../../../models/auth/usersModel');

const verifyAccount = catchAsync(async (req, res, next) => {
    const { token, id } = req.query;

    if (!token || !id) {
        return next(new AppError('Token or id not found', 400));
    }

    const verificationDoc = await UserVerification.findOne({ userId: id });
    if (!verificationDoc) {
        return next(new AppError('Invalid userId', 404));
    } else {
        const isValid = await verificationDoc.compareToken(
            token,
            verificationDoc.token
        );
        console.log('isValid', isValid);

        if (!isValid) {
            return next(
                new AppError('Invalid or expired verification token', 401)
            );
        } else {
            await User.updateOne(
                { _id: id },
                {
                    $unset: { tokenExpireAt: 1 },
                    $set: { status: 'TRIAL', active: true }
                }
            );

            // delete verification document
            await verificationDoc.deleteOne();

            // after successfully verifying account redirect to web url
            res.redirect(301, CONFIG.SITE_URL);
        }
    }
});

// controller to resend verification code
const resendVerificationCode = catchAsync(async (req, res) => {
    const { email } = req.body;
    const name = req.name;
    const userId = req.userId;

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const token = await bcrypt.hash(
        verificationToken,
        Number(CONFIG.BCRYPT_SALT)
    );

    // update token. set newly generated token to database
    await UserVerification.updateOne({ email }, { $set: { token } });

    // generate link
    const link = `${CONFIG.URL}/v1/auth/verification/verify-account?token=${verificationToken}&id=${userId}`;

    await SendMailService.userVerificationMail({ email, name }, link);
    res.status(200).json({
        status: 'success',
        message: 'Verification code has been sent'
    });
});

module.exports = { verifyAccount, resendVerificationCode };
