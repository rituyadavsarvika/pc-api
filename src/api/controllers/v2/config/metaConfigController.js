// Load utils
const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');

// load model
const GoogleSearchConsole = require('../../../../models/config/googleSearchConsoleModel');
const GoogleAdSense = require('../../../../models/config/googleAdSenseModel');
const PinterestVerification = require('../../../../models/config/pinterestVerificationModel');

/**
 * @param  {} async it's an async function
 * @param  {req} request object
 * @param  {res} response object
 * @description Get all google search console content
 */
const getMetaConfigs = catchAsync(async (req, res) => {
    // console.log("req.query:::", req.query);
    let gscList, adSenseList, pvList
    const { multiple } = req.query

    let queryFor = multiple.split(',')

    if (queryFor.includes('gsc')) {
        const featureGSC = new APIFeature(GoogleSearchConsole.find(), req.query)
            .filter()
            .limitFields();

        gscList = await featureGSC.query;
    }

    if (queryFor.includes('gas')) {
        const featureGAdSense = new APIFeature(GoogleAdSense.find(), req.query)
            .filter()
            .limitFields();

        adSenseList = await featureGAdSense.query;
    }

    if (queryFor.includes('pv')) {
        const featurePV = new APIFeature(PinterestVerification.find(), req.query)
            .filter()
            .limitFields();

        pvList = await featurePV.query;
    }

    Promise.all([gscList, adSenseList, pvList])
        .then(() => {
            res.status(200).json({
                status: 'success',
                data: { gscList, adSenseList, pvList }
            });
        })
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err?.message}`
            })
        );
});

// /**
//  * @param  {} async it's an async function
//  * @param  {req} request object
//  * @param  {res} response object
//  * @description Get google search console details by id
//  */
// const getById = catchAsync(async (req, res) => {
//     const config = await GoogleAdSense.findOne({ _id: req.params.id });
//     res.status(200).json({
//         status: 'success',
//         data: config
//     });
// });

module.exports = { getMetaConfigs };
