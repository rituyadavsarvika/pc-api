// Load utils
const catchAsync = require('../../utils/error/catchAsync');
const APIFeature = require('./../../utils/apiFeatures');

// load model
const OutgoingMailConfig = require('../../models/outGoingMailConfigModel');

// create mail config
const upsertConfig = catchAsync(async (req, res) => {
    const { adminType, franchiseeId } = req.body;
    let condition = undefined;

    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
        req.body.franchiseeId = undefined;
    } else {
        condition = { adminType: 'CA', franchiseeId };
    }

    const newConfig = await OutgoingMailConfig.updateOne(condition, req.body, {
        upsert: true,
        runValidators: true
    });
    res.status(200).json({ status: 'success', data: newConfig });
});

// get all mail config
const getAllConfig = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        OutgoingMailConfig.find().select('+smtpPass'),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const configList = await feature.query;

    Promise.all([configList]).then(() => {
        res.status(200).json({
            status: 'success',
            result: configList.length,
            data: configList
        });
    });
});

// get a specific config by id
const getConfig = catchAsync(async (req, res) => {
    const config = await OutgoingMailConfig.findOne({ _id: req.params.id });
    res.status(200).json({
        status: 'success',
        data: config
    });
});

// update a config by id
const updateConfig = catchAsync(async (req, res) => {
    const updatedConfig = await OutgoingMailConfig.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    Promise.all([updatedConfig]).then(() => {
        res.status(200).json({
            status: 'success',
            data: updatedConfig
        });
    });
});

module.exports = { upsertConfig, getAllConfig, getConfig };
