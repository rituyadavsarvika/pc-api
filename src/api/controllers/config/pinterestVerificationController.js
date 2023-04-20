// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// load model
const PinterestVerification = require('../../../models/config/pinterestVerificationModel');

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description this with do insertion if no data found with provided franchiseeId.
 * if data found then it will update that document
 */
const upsertData = catchAsync(async (req, res) => {
    const { adminType, franchiseeId } = req.body;
    let condition = undefined;

    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
        req.body.franchiseeId = undefined;
    } else {
        condition = { adminType: 'CA', franchiseeId };
    }

    const data = await PinterestVerification.updateOne(condition, req.body, {
        upsert: true,
        runValidators: true
    });
    res.status(200).json({ status: 'success', data: data });
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Get all google search console content
 */
const getAll = catchAsync(async (req, res, next) => {
    const feature = new APIFeature(PinterestVerification.find(), req.query)
        .filter()
        .limitFields();

    const dataList = await feature.query;

    Promise.all([dataList]).then(() => {
        res.status(200).json({
            status: 'success',
            data: dataList
        });
    });
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Get google search console details by id
 */
const getById = catchAsync(async (req, res) => {
    const detail = await PinterestVerification.findOne({ _id: req.params.id });
    res.status(200).json({
        status: 'success',
        data: detail
    });
});

module.exports = { upsertData, getAll, getById };
