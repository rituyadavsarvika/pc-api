const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');
const Validator = require('../../../utils/validator');

// Load Model
const SubscriberConfig = require('../../../models/config/subscriberConfigModel');
const Users = require('../../../models/auth/usersModel');

// Load auth Service
const AuthService = require('./../../../../service/authService');

// insert of update document depending on franchiseeId
const upsertData = catchAsync(async (req, res) => {
    let { adminType, franchiseeId, subscriptionExpireAt } = req.body;
    let cDomain = req.customDomain;

    if (cDomain) {
        req.body.customDomain['domain'] = cDomain;
    }

    // generate upsert condition
    let condition = {};
    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
        req.body.franchiseeId = undefined;
    } else condition = { adminType: 'CA', franchiseeId };

    const newConfig = await SubscriberConfig.updateOne(condition, req.body, {
        upsert: true,
        runValidators: true
    });

    res.status(201).json({
        status: 'success',
        data: newConfig
    });

    if (subscriptionExpireAt)
        return AuthService.updateSubscriptionExpireAt(
            subscriptionExpireAt,
            franchiseeId
        );
});

// get all config with filter criteria
const getAllConfig = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        SubscriberConfig.find().populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const configList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        SubscriberConfig.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([configList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: configList
        });
    });
});

// get a config by id
const getConfig = catchAsync(async (req, res) => {
    let result;
    let config;
    let user;
    config = await SubscriberConfig.findOne({
        _id: req.params.id
    })
        .populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        })
        .select('-createdAt -updatedAt -__v');

    if (!Validator.isEmptyObject(config)) {
        result = JSON.parse(JSON.stringify(config));
        user = await Users.findOne({ franchiseeId: result.franchiseeId });
        result['tokenExpireAt'] = user.tokenExpireAt || null;
        result['trialExpireAt'] = user.trialExpireAt || null;
    }

    Promise.all([config, user]).then(() => {
        res.status(200).json({
            status: 'success',
            data: result
        });
    });
});

module.exports = { upsertData, getAllConfig, getConfig };
