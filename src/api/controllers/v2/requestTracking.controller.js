// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');

// Load Model
const GlobalSettings = require('../../../models/website/global/globalSettings.model');
const GoogleAdSenseModel = require('../../../models/config/googleAdSenseModel');
const GoogleSearchConsoleModel = require('../../../models/config/googleSearchConsoleModel');
const PinterestVerification = require('../../../models/config/pinterestVerificationModel');
const RequestTracking = require('../../../models/requestTrackingModel');

// create New Global settings
// const createNew = catchAsync(async (req, res) => {
//     const newSettings = await GlobalSettings.create(req.body);
//     res.status(201).json({
//         status: 'success',
//         data: newSettings
//     });
// });

// Get All Settings with query Filter Option
const getAllRequest = catchAsync(async (req, res) => {
    // const feature = new APIFeature(
    //     RequestTracking.find(),
    //     req.query
    // )
    //     .filter()
    //     .sort()
    //     .limitFields()
    //     .paginate();

    // const feature = await RequestTracking.distinct('originalUrl').exec()
    const feature = await RequestTracking.aggregate([
        {
            $group: {
                "_id": {
                    osInfo: "$osInfo",
                    clientIp: "$clientIp"
                } 
            } 
        }
    ])

    const trackingList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        RequestTracking.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([trackingList, cQuery]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: trackingList,
            feature
            // seo: seoObj
        });
    });
});


module.exports = {
    getAllRequest
};
