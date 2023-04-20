const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const jwtDecode = require('jwt-decode');

// Load Error handler
const catchAsync = require('../../../utils/error/catchAsync');
const AppError = require('../../../utils/error/appError');
const validator = require('./../../../utils/validator');

const config = require('./../../../../config/keys');

// Load Model
const userModel = require('../../../models/auth/usersModel');
const emailRoleModel = require('./../../../models/emailRoleRel.model');
const Franchisee = require('./../../../models/franchisee/franchiseeModel');
const Validator = require('./../../../utils/validator');
const keys = require('./../../../../config/keys');
const expressBasicAuth = require('express-basic-auth');

const protectRoute = catchAsync(async (req, res, next) => {
    const { method } = req;
    // 1) check if token exist
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    )
        token = req.headers.authorization.split(' ')[1];

    let encodedToken = jwtDecode(token);

    console.log("encodedToken:::", encodedToken);

    req.email = encodedToken?.payload?.email
    if (method == 'POST') {
        req.body['createdBy'] = encodedToken?.payload?.id
    }
    else if (method == 'PATCH') {
        req.body['updatedBy'] = encodedToken?.payload?.id
    }


    if (!token)
        return next(
            new AppError(
                'You are not logged in. Please login to get access',
                401
            )
        );

    // 2) token verification
    const decode = await promisify(jwt.verify)(token, config.JWT_SECRET);

    // 3) Check if user still exist or deleted after token issued
    const decodedUser = await userModel.findOne({ _id: decode.payload?.id });
    if (!decodedUser)
        return next(
            new AppError(
                'The user belonging to this token is no longer exist.',
                401
            )
        );

    // 4) check if user changed password after token issued
    if (decodedUser.changedPasswordAfterToken(decode.iat))
        return next(
            new AppError(
                'Your password has been changed recently. Please login again',
                401
            )
        );

    // Grant access to protected route
    req.user = decodedUser;
    next();
});

const isUser = catchAsync(async (req, res, next) => {
    const email = req.body.email;
    const userList = [
        'SUPERADMIN',
        'ADMIN',
        'SUBSCRIPTIONOWNER',
        'SUBSCRIBERADMIN',
        'BUSINESSADMIN'
    ];
    const doc = await emailRoleModel.findOne({ email });
    if (!doc) return next(new AppError('Invalid user email or password', 401));
    else {
        req.roleType = userList.includes(doc.userRole) ? 'user' : 'customer';
        next();
    }
});

const checkInput = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
        return next(new AppError('Please provide valid email & password', 400));

    next();
};

const checkDomain = catchAsync(async (req, res, next) => {
    const { email, subDomain, franchisee } = req.body;

    const user = await userModel.findOne({ email, franchiseeId: franchisee }).select('+password');

    // if no user found then return with error
    if (!user) return next(new AppError('You are not supposed to login here', 403));

    // set user object to req object
    req.user = user;
    const { role, franchiseeId } = user;
    const userRole = role.toUpperCase();
    const superAdminRoleList = ['SUPERADMIN', 'ADMIN'];
    const subscriberRoleList = ['SUBSCRIPTIONOWNER', 'SUBSCRIBERADMIN', 'BUSINESSADMIN'];

    let isValid = false;
    let docByDomain = null;
    let docBySubDomain = null;
    let franchisee_id = null;

    docByDomain = await Franchisee.findOne({ domain: subDomain, _id: franchiseeId });

    if (!Validator.isEmptyObject(docByDomain)) {
        isValid = true;
        franchisee_id = docByDomain._id;
    } else {
        docBySubDomain = await Franchisee.findOne({ domainSlug: subDomain, _id: franchiseeId });
        if (!Validator.isEmptyObject(docBySubDomain)) {
            isValid = true;
            franchisee_id = docBySubDomain._id;
        }
    }

    if (superAdminRoleList.includes(userRole) && !docByDomain && !docBySubDomain) {

        if ((subDomain)) {
            next()
        }
        else {
            return res.status(406).json({
                status: 'fail',
                message: 'You are not supposed to login here',
                url: config.SITE_URL
            });
        }
    }
    else if (subscriberRoleList.includes(userRole) && (docByDomain || docBySubDomain)) {
        if ((subDomain == docByDomain?.domain) || (subDomain == docBySubDomain?.domainSlug)) {
            next()
        }
        else {
            return res.status(406).json({
                status: 'fail',
                message: 'You are not supposed to login here',
                url: config.SITE_URL
            });
        }
    }
    else {
        return res.status(406).json({
            status: 'fail',
            message: 'You are not supposed to login here',
            url: config.SITE_URL
        });
    }
});

// check if userId is valid or not
const checkValidId = (req, res, next) => {
    const email = req.body.email;
    validator
        .isValidId(userModel.findOne({ email }), email)
        .then(() => next())
        .catch(err => next(new AppError(err, 404)));
};

// middleware to check is admin (Super admin, city admin, business admin) user.
const isAdminUser = (req, res, next) => {
    const roleList = [
        'SUPERADMIN',
        'ADMIN',
        'SUBSCRIPTIONOWNER',
        'SUBSCRIBERADMIN',
        'BUSINESSADMIN'
    ];
    const tokenUserRole = req.user ? req.user.role : undefined;

    validator
        .isAdmin(roleList, tokenUserRole)
        .then(() => next())
        .catch(err => next(new AppError(err, 401)));
};

// middleware to check is admin Super admin user.
const isSuperAdminUser = (req, res, next) => {
    const roleList = ['SUPERADMIN', 'ADMIN'];
    const tokenUserRole = req.user ? req.user.role : undefined;

    validator
        .isAdmin(roleList, tokenUserRole)
        .then(() => next())
        .catch(err => next(new AppError(err, 401)));
};

// middleware to check is admin Super admin user.
const isSuperOrCityAdminUser = (req, res, next) => {
    const roleList = [
        'SUPERADMIN',
        'ADMIN',
        'SUBSCRIPTIONOWNER',
        'SUBSCRIBERADMIN'
    ];
    const tokenUserRole = req.user ? req.user.role : undefined;

    validator
        .isAdmin(roleList, tokenUserRole)
        .then(() => next())
        .catch(err => next(new AppError(err, 401)));
};

// middleware to check is business admin
const isBusinessAdminUser = (req, res, next) => {
    const roleList = ['BUSINESSADMIN'];
    const tokenUserRole = req.user ? req.user.role : undefined;

    validator
        .isAdmin(roleList, tokenUserRole)
        .then(() => next())
        .catch(err => next(new AppError(err, 401)));
};

const isPermitted = (req, res, next) => {
    const adminType = req.body.adminType;
    const tokenUserRole = req.user ? req.user.role : undefined;

    if (['SA'].includes(adminType)) {
        validator
            .isAdmin(['SUPERADMIN', 'ADMIN'], tokenUserRole)
            .then(() => next())
            .catch(err => next(new AppError(err, 401)));
    } else if (['CA'].includes(adminType)) {
        validator
            .isAdmin(
                ['SUPERADMIN', 'ADMIN', 'SUBSCRIPTIONOWNER', 'SUBSCRIBERADMIN'],
                tokenUserRole
            )
            .then(() => next())
            .catch(err => next(new AppError(err, 401)));
    } else {
        return next(new AppError('Invalid adminType', 400));
    }
};

// check if email already exists or not
const checkDuplicateEmail = (req, res, next) => {
    validator
        .isDuplicate(
            userModel.findOne({ email: req.body.email }),
            req.body.email,
            'email'
        )
        .then(() => next())
        .catch(() =>
            next(
                new AppError(`The email address is already in use. Use a different email.`, 409)
            )
        );
};

// check is subscriptionOwner
const isSubscriptionOwner = (req, res, next) => {
    const roleList = ['SUPERADMIN', 'SUBSCRIPTIONOWNER'];
    const tokenUserRole = req.user ? req.user.role : undefined;

    validator
        .isAdmin(roleList, tokenUserRole)
        .then(() => next())
        .catch(err => next(new AppError(err, 401)));
};

const basicAuthorizer = (username, password) => {
    console.log("username, password:::", username, password);
    const userMatches = expressBasicAuth.safeCompare(username, keys.BASIC_AUTH_USERNAME)
    const passwordMatches = expressBasicAuth.safeCompare(password, keys.BASIC_AUTH_PASSWORD)

    return userMatches & passwordMatches
}

const basicAuthorizerError = (req) => {
    // new AppError(`User Already created with ${req.body.email}`, 409)
    // console.log("req:::", req.auth);
    let data = {
        statusCode: 500,
        status: `${this.statusCode}`.startsWith('4') ? 'fail' : 'error',
        isOperational: false,
        message: ''
    }

    if (req.auth) {
        data.statusCode = 401
        data.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error',
            data.message = `Credentials ${req.auth.user} : ${req.auth.password} rejected`
    }
    else {
        data.statusCode = 401
        data.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error',
            data.message = `No credentials provided`
    }

    return data
}

module.exports = {
    isUser,
    isAdminUser,
    checkInput,
    checkDomain,
    protectRoute,
    checkValidId,
    isSuperAdminUser,
    isSuperOrCityAdminUser,
    isBusinessAdminUser,
    isPermitted,
    checkDuplicateEmail,
    isSubscriptionOwner,
    basicAuthorizer,
    basicAuthorizerError
};
