const keys = require('./../../../../config/keys');

// Load Error handler
const AppError = require('../../../utils/error/appError');
const validator = require('./../../../utils/validator');
const catchAsync = require('./../../../utils/error/catchAsync');
const DataFormater = require('./../../../utils/dataFormate');

// Load Model
const Franchisee = require('./../../../models/franchisee/franchiseeModel');
const SubscriberConfig = require('./../../../models/config/subscriberConfigModel');
const { getReservedSubDoamin, getRestrictedEmail } = require('../../../utils/reservedSubDomain');
const { NODE_ENV } = require('./../../../../config/keys');
const { Types } = require('mongoose');
const FranchiseeModel = require('./../../../models/franchisee/franchiseeModel');

// middleware to generate slug with name
const generateSlug = catchAsync(async (req, res, next) => {
    let { domainKey } = req.body;
    if (domainKey) {
        slug = await DataFormater.generateSlug(domainKey);
        req.body.domainSlug = slug;
    }

    next();
});

// check if slug already exist or not. if exist then add a 8 digit number as a suffix
const setSlugField = catchAsync(async (req, res, next) => {
    const excludeDomainList = getReservedSubDoamin()
    const { domainSlug } = req.body;

    if (excludeDomainList.includes(domainSlug))
        return next(new AppError(`${req.body.domainKey} is reserved key`, 400));

    if (domainSlug) {
        const { id } = req.params;
        const doc = await Franchisee.findOne({
            domainSlug,
            _id: { $ne: id }
        });
        if (!validator.isEmptyObject(doc)) {
            const uId = await DataFormater.generateUniqueNumber(4, false, true);
            slug = `${domainSlug}-${uId}`;
            req.body.domainSlug = slug;
            req.body.generatedDomain = `${slug}.${keys.FRONT_URL.HOST}`;
        } else
            req.body.generatedDomain = `${domainSlug}.${keys.FRONT_URL.HOST}`;
    }
    next();
});

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.franchiseeId;
    if (id) {
        validator
            .isValidId(Franchisee.findOne({ _id: id }), id, 'Subscriber')
            .then(() => next())
            .catch(() => next(new AppError('Invalid Subscriber', 400)));
    } else next();
};

const checkValidIdMandatory = (req, res, next) => {
    const id =
        req.params.id ||
        req.body.franchiseeId ||
        req.params.franchiseeId ||
        req.body.subscriberId;

    validator
        .isValidId(
            Franchisee.findOne({ _id: id }).select(
                '+stripeSubscriptionId +stripeCustomerId'
            ),
            id,
            'Subscriber'
        )
        .then(data => {
            req.domainSlug = data?.domainSlug;
            req.code = data?.code;
            req.franchiseeName = data?.name;
            req.email = data?.email;
            req.subscriptionId = data?.stripeSubscriptionId;
            req.stripeCustomerId = data?.stripeCustomerId;
            next();
        })
        .catch(() => next(new AppError('Invalid Subscriber Id', 404)));
};

const checkAdminTypeFranchiseeId = (req, res, next) => {
    const adminType = req.body.adminType || req.params.adminType;
    const franchiseeId =
        req.body.franchiseeId ||
        req.query.franchiseeId ||
        req.params.franchiseeId;

    if (adminType === 'CA') {
        Franchisee.findOne({ _id: franchiseeId })
            .then(doc => {
                if (validator.isEmptyObject(doc))
                    next(new AppError(`Invalid Subscriber Id`, 400));
                else {
                    req.domainSlug = doc?.domainSlug;
                    req.customDomain = doc?.domain;
                    req.code = doc?.code;
                    next();
                }
            })
            .catch(err =>
                next(new AppError(`${err.name} ${err.message}`, 500))
            );
    } else if (adminType === 'SA') {
        req.body.franchiseeId = undefined;
        req.params.franchiseeId = undefined;
        req.query.franchiseeId = undefined;
        req.domainSlug = 'superadmin';
        req.code = keys?.CODE;
        next();
    } else return next(new AppError('Invalid admin type', 400));
};

const checkDuplicateEmail = (req, res, next) => {
    // const email = req.body.email;
    const { email } = req.body;
    const id = req.params.id;
    let query = undefined;

    if (NODE_ENV === 'production') {
        const restrictedEmailList = getRestrictedEmail()
        const splitEmail = email.split('@'); // To Get Array

        if (restrictedEmailList.indexOf(splitEmail && splitEmail[1]) >= 0) {
            // Means it has the rejected domains
            return next(new AppError(`${email} is restricted`, 400));
        }
    }

    if (id) {
        query = Franchisee.findOne({
            email,
            _id: { $ne: id }
        });
    } else {
        query = Franchisee.findOne({
            email
        });
    }

    validator
        .isDuplicate(query, email, 'email')
        .then(() => next())
        .catch(err =>
            next(
                new AppError(
                    `Franchisee already created with the email '${req.body.email}'`,
                    409
                )
            )
        );
};

const updateSubscriberConfig = catchAsync(async (req, res, next) => {
    // const { domain } = req.body;
    const franchiseeId = req.params.id;

    const roleList = ['SUPERADMIN'];
    const tokenUserRole = req.user ? req.user.role : undefined;


    if (roleList.includes(tokenUserRole)) {
        next();
    }
    else {
        // -----------------
        // Subscriber data
        const subscriptionInfo = await SubscriberConfig
            .findOne({ franchiseeId: Types.ObjectId(franchiseeId) })
            .populate({
                path: 'subscriptionPlanId',
                select: 'name isFreePlan publish'
            })
            .populate({
                path: 'customDomain.updatedBy',
                select: 'role'
            })
            .select('-__v')
            .lean()
        // ------------

        if (roleList.includes(subscriptionInfo?.customDomain?.updatedBy?.role)) {
            next()
        }
        else {
            const { id } = req.params
            let domainHandler = {
                status: '',
                message: ''
            }

            const getSubscriberByDoamin = await FranchiseeModel.findOne({
                $and: [
                    // { domain: { $ne: "" } },
                    // { domain: { $eq: req.body.domain } },
                    {_id: id}
                ]
            })

            if (req.body.domain !== getSubscriberByDoamin?.domain) {
                domainHandler.status = 'failed'
                domainHandler.message = 'Custom domain is unassignable'
                req.body['domainObject'] = domainHandler
                req.body.domain = ''
            }

            if (!subscriptionInfo) {
                req.body.domain = ''
                // next();
            }
            else if (
                !subscriptionInfo?.subscriptionPlanId
                || subscriptionInfo?.subscriptionPlanId?.isFreePlan
                && subscriptionInfo?.subscriptionPlanId?.publish
            ) {
                req.body.domain = ''
            }
            next();
        }
    }

    // // ----------------
    // const freePlan = await SubscriptionPlan.findOne({
    //     $and: [
    //         { isFreePlan: true },
    //         { publish: true }
    //     ]
    // });

    // if (freePlan && !Validator.isEmptyObject(freePlan))
    //     req.body.subscriptionPlanId = freePlan._id;

    // // ---------------

    // if (req.body.domain) {
    //     await SubscriberConfig.updateOne(
    //         { franchiseeId },
    //         {
    //             $set: {
    //                 'customDomain.domain': req.body.domain,
    //                 'customDomain.isServerConfigCreated': false,
    //                 'customDomain.isARecordCreated': false,
    //                 'customDomain.isSslActive': false,
    //                 'customDomain.sslExpireAt': null
    //             }
    //         }
    //     );
    // }
    // next();
});

module.exports = {
    checkValidId,
    checkDuplicateEmail,
    checkValidIdMandatory,
    checkAdminTypeFranchiseeId,
    setSlugField,
    generateSlug,
    updateSubscriberConfig
};
