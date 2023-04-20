// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// load model
const GoogleSearchConsole = require('../../../models/config/googleSearchConsoleModel');

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

    const gSearchConsole = await GoogleSearchConsole.updateOne(
        condition,
        req.body,
        {
            upsert: true,
            runValidators: true
        }
    );
    res.status(200).json({ status: 'success', data: gSearchConsole });
});

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Get all google search console content
 */
const getAll = catchAsync(async (req, res, next) => {
    const feature = new APIFeature(GoogleSearchConsole.find(), req.query)
        .filter()
        .limitFields();

    const consoles = await feature.query;

    Promise.all([consoles]).then(() => {
        res.status(200).json({
            status: 'success',
            data: consoles
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
    const config = await GoogleSearchConsole.findOne({ _id: req.params.id });
    res.status(200).json({
        status: 'success',
        data: config
    });
});

module.exports = { upsertData, getAll, getById };
