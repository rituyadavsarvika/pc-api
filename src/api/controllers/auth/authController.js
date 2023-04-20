const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../../../config/keys');

// Load Model
const EmailRoleRel = require('./../../../models/emailRoleRel.model');
const userModel = require('../../../models/auth/usersModel');
const Customer = require('./../../../models/franchisee/customer/customerModel');
const Token = require('../../../models/auth/token.model');
const UserVerification = require('../../../models/auth/userVerification.model');

// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const AppError = require('../../../utils/error/appError');
const APIFeature = require('../../../utils/apiFeatures');
const dateUtils = require('./../../../utils/dateTime');

// Load Service
const emailService = require('../../../../service/sendMail');
const SubscriberConfig = require('./../../../models/config/subscriberConfigModel');

// Generate token by user._id
const getToken = (id, email) => {
    const payload = {
        id: id,
        email: email
    };

    return jwt.sign({ payload, iat: new Date().getTime() }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN
    });
};

// Generate account verification link
const generateVerification = catchAsync(async (userId, email, name) => {
    const verification = await UserVerification.findOne({ email });
    if (verification) await verification.deleteOne();

    let verificationToken = crypto.randomBytes(32).toString('hex');

    // create new Verification document
    await new UserVerification({
        userId,
        email,
        token: verificationToken,
        createdAt: Date.now()
    }).save();

    // generate mail
    const link = `${config.URL}/api/auth/verification/verify-account?token=${verificationToken}&id=${userId}`;

    await emailService.userVerificationMail({ userId, email, name }, link);
});

// user login
const login = catchAsync(async (req, res, next) => {
    const { password, franchisee } = req.body;
    const user = req.user;
    const subscriberConfig = await SubscriberConfig
        .findOne({ franchiseeId: franchisee })
        .populate({
            path: 'subscriptionPlanId',
            model: 'SubscriptionPlan',
            select: 'name isFreePlan planType summary'
        })
        .select('subscriptionPlanId subscriptionExpireAt')
        .lean();

    if (!(await user.comparePassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 403));
    } else if (!user?.active) {
        return next(new AppError('This account is deactivated', 403));
    } else {
        // everything is ok
        const token = getToken(user._id, user.email);
        res.status(200).json({
            status: 'success',
            id: user._id,
            email: user.email,
            name: user.firstName + (user.lastName ? ' ' + user.lastName : ''),
            firstName: user?.firstName,
            lastName: user?.lastName,
            franchiseeId: user.franchiseeId,
            role: user.role ? user.role : 'CUSTOMER',
            businessId: user.businessId,
            hasSubscriptionExpired:
                user.status === 'SUBSCRIPTION_EXPIRED' ? true : false,
            subscriberConfig,
            token
        });
    }
});

// Create a user with role SUPERADMIN
const createNewAdmin = (req, res, next) => {
    // Get variables
    const { firstName, lastName, email, phone, password, confirmPassword } =
        req.body;

    // create email role rel document
    EmailRoleRel.create({
        email,
        userRole: 'ADMIN'
    })
        .then(newEmailRole => {
            return userModel.create({
                firstName,
                lastName: lastName || '',
                email,
                password,
                confirmPassword,
                phone,
                role: newEmailRole.userRole,
                status: 'TRIAL'
            });
        })
        .then(newSuperAdmin => {
            generateVerification(
                newSuperAdmin._id,
                newSuperAdmin.email,
                newSuperAdmin.firstName
            );
        })
        .then(() =>
            res.status(201).json({
                status: 'success',
                message: `New admin created with email ${email}`
            })
        )
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err?.message}`
            })
        );
};

// create a new user with role CITYADMIN
const createNewSubscriberAdmin = (req, res) => {
    // Get variables
    const {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        franchiseeId
    } = req.body;

    const subscriptionExpireAt = req.subscriptionExpireAt;

    // create email role rel document
    EmailRoleRel.create({
        email,
        userRole: 'SUBSCRIBERADMIN'
    })
        .then(newEmailRole => {
            return userModel.create({
                firstName,
                lastName: lastName || '',
                email,
                phone,
                password,
                confirmPassword,
                franchiseeId,
                role: newEmailRole.userRole,
                status: 'SUBSCRIBED',
                subscriptionExpireAt
            });
        })
        // .then(newSubscriberAdmin => {
        //     generateVerification(
        //         newSubscriberAdmin._id,
        //         newSubscriberAdmin.email,
        //         newSubscriberAdmin.firstName
        //     );
        // })
        .then(newSubscriberAdmin =>
            res.status(201).json({
                status: 'success',
                message: `New Subscriber Admin created with email ${email}`
            })
        )
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err?.message}`
            })
        );
};

// Create a new user with role BUSINESSADMIN
const createBusinessAdmin = catchAsync(async (req, res, next) => {
    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        address,
        phone,
        businessId,
        franchiseeId
    } = req.body;
    // create email role rel document
    const newEmailRole = await EmailRoleRel.create({
        email: req.body.email,
        userRole: 'BUSINESSADMIN'
    });

    // for super admin role should be BUSINESSADMIN
    userModel
        .create({
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            address,
            phone,
            role: 'BUSINESSADMIN',
            businessId,
            franchiseeId
        })
        .then(newBusinessAdmin => {
            // user Verification Mail
            // TODO: Have to manage resend verification mail in all user creation
            generateVerification(
                newBusinessAdmin._id,
                newBusinessAdmin.email,
                newBusinessAdmin.firstName
            );

            // Generate token
            const token = getToken(
                newBusinessAdmin._id,
                newBusinessAdmin.email
            );

            res.status(201).json({
                status: 'success',
                token,
                role: newBusinessAdmin.role,
                id: newBusinessAdmin._id,
                name:
                    newBusinessAdmin.firstName +
                    (newBusinessAdmin.lastName
                        ? ' ' + newBusinessAdmin.lastName
                        : ''),
                email: newBusinessAdmin.email,
                businessId: newBusinessAdmin.businessId
            });
        })
        .catch(err => {
            // delete newEmailRole document
            newEmailRole.delete();
            return next(new AppError(`${err.name} ${err.message}`, 500));
        });
});

/**
 * @description get all user
 * @type async function
 * @param  {} req
 * @param  {} res
 */
const getAllUsers = (req, res) => {
    const feature = new APIFeature(userModel.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    feature.query
        .then(userList =>
            res.status(200).json({
                status: 'success',
                result: userList.length,
                data: userList
            })
        )
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err?.message}`
            })
        );
};

/**
 * @description change user password with email notification
 * @type async function
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 * @param {req.body.email, req.body.currentPassword, req.body.newPassword, req.body.newConfirmPassword}
 */
const changePassword = catchAsync(async (req, res, next) => {
    const { email, currentPassword, newPassword, newConfirmPassword } =
        req.body;

    let user;
    if (req.roleType && req.roleType === 'user') {
        user = await userModel.findOne({ email }).select('+password');
    } else {
        user = await Customer.findOne({ email }).select('+password');
    }

    // check is user password & current password are matched
    const isMatch = await user.comparePassword(currentPassword, user.password);

    if (!user || !isMatch) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // set new password and new confirm password to user
    user.password = newPassword;
    user.confirmPassword = newConfirmPassword;
    user.passwordChangedAt = new Date();
    user.save();

    res.status(200).json({
        status: 'success',
        message: 'Successfully changed password'
    });
});

/**
 * @description  requestReset user password with email notification
 * @type Async function
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 * @param {req.body.email}
 */
const resetPasswordRequestController = catchAsync(async (req, res, next) => {
    const email = req.body.email;
    const user = await userModel.findOne({ email });
    if (!user)
        return res.status(406).json({
            status: "fail",
            error: {
                statusCode: 406,
                status: "fail",
                isOperational: true
            },
            message: `${email} doesn't not exist`,
        });

    let token = await Token.findOne({ userId: user._id });
    if (token) await token.deleteOne();

    let resetToken = crypto.randomBytes(32).toString('hex');

    Promise.all([user, token]).then(async () => {
        await new Token({
            userId: user._id,
            token: resetToken,
            createdAt: Date.now()
        }).save();

        emailService.resetPasswordRequestMail(
            {
                userId: user._id,
                email: user.email,
                franchiseeId: user?.franchiseeId
            },
            resetToken,
            {
                name: user.firstName,
                link: ''
            }
        );

        res.status(200).json({
            status: 'success'
        });
    });
});

/**
 * @description  reset user password with email notification
 * @type Async function
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 * @param {req.params.token & req.params.id}
 */
const resetPassword = catchAsync(async (req, res, next) => {
    const { token, id } = req.query;
    const { newPassword, confirmNewPassword } = req.body;

    const tokenDoc = await Token.findOne({ userId: id });

    if (!tokenDoc) {
        return next(
            new AppError('Invalid or expired password reset token', 400)
        );
    } else {
        const isValid = await tokenDoc.compareToken(token, tokenDoc.token);

        if (!isValid) {
            return next(
                new AppError('Invalid or expired password reset token', 401)
            );
        } else {
            userModel.findOne({ _id: id }).then(async user => {
                // set new password and new confirm password to user
                user.password = newPassword;
                user.confirmPassword = confirmNewPassword;
                user.save();

                // delete reset token
                await tokenDoc.deleteOne();

                res.status(200).json({
                    status: 'success',
                    message: 'Password Reset Successfully'
                });

                // send success email
                await emailService.resetPasswordResetSuccessMail({
                    name: user.firstName,
                    email: user.email
                });
            });
        }
    }
});

// Controller to replace user password without current password or token
const replacePassword = catchAsync(async (req, res, next) => {
    // get variable
    const { email, newPassword, newConfirmPassword } = req.body;

    // get user object depending on user role
    let user;
    if (req.roleType && req.roleType === 'user') {
        user = await userModel.findOne({ email }).select('+password');
    } else {
        user = await Customer.findOne({ email }).select('+password');
    }

    // set new password and new confirm password to user
    user.password = newPassword;
    user.confirmPassword = newConfirmPassword;
    user.passwordChangedAt = new Date();
    user.save();

    res.status(200).json({
        status: 'success',
        message: 'Successfully replaced password'
    });
});

const extendSubscription = catchAsync(async (req, res) => {
    const { subscriberId, expireAt } = req.body;

    if (!expireAt) {
        return res
            .status(400)
            .json({ status: 'fail', message: "ExpireAt can't be empty" });
    }

    // get start and end of a specific day
    const { endSearchDate } = await dateUtils.generateSearchAbleDate(
        expireAt,
        'DD/MM/YYYY'
    );

    SubscriberConfig
        .updateOne(
            { franchiseeId: subscriberId },
            { $set: { subscriptionExpireAt: endSearchDate } },
            { runValidators: true }
        )
        .then(config => {
            return userModel.updateMany(
                { franchiseeId: subscriberId },
                {
                    $set: {
                        subscriptionExpireAt: endSearchDate,
                        status: 'SUBSCRIBED'
                    }
                },
                { runValidators: true }
            );
        })
        .then(users =>
            res.status(200).json({
                status: 'success',
                message: `Subscription extended to till ${endSearchDate}`
            })
        )
        .catch(err =>
            res
                .status(500)
                .json({ status: 'fail', message: `${err.name} ${err.message}` })
        );
});

module.exports = {
    login,
    createNewAdmin,
    createNewSubscriberAdmin,
    createBusinessAdmin,
    getAllUsers,
    changePassword,
    resetPasswordRequestController,
    resetPassword,
    replacePassword,
    extendSubscription
};
