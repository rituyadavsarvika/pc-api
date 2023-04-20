// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');

// load model
const GoogleAdSense = require('../../../models/config/googleAdSenseModel');

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

    const adSense = await GoogleAdSense.updateOne(condition, req.body, {
        upsert: true,
        runValidators: true
    });
    res.status(200).json({ status: 'success', data: adSense });
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Get all google search console content
 */
const getAll = (req, res) => {
    const feature = new APIFeature(GoogleAdSense.find(), req.query)
        .filter()
        .limitFields();

    feature.query
        .then(adSenseList =>
            res.status(200).json({
                status: 'success',
                data: adSenseList
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
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Get google search console details by id
 */
const getById = catchAsync(async (req, res) => {
    const config = await GoogleAdSense.findOne({ _id: req.params.id });
    res.status(200).json({
        status: 'success',
        data: config
    });
});

module.exports = { upsertData, getAll, getById };
