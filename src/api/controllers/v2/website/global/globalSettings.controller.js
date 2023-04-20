// Load utils
const catchAsync = require('./../../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../../utils/apiFeatures');

// Load Model
const GlobalSettings = require('../../../../../models/website/global/globalSettings.model');
const GoogleAdSenseModel = require('../../../../../models/config/googleAdSenseModel');
const GoogleSearchConsoleModel = require('../../../../../models/config/googleSearchConsoleModel');
const PinterestVerification = require('../../../../../models/config/pinterestVerificationModel');

// create New Global settings
// const createNew = catchAsync(async (req, res) => {
//     const newSettings = await GlobalSettings.create(req.body);
//     res.status(201).json({
//         status: 'success',
//         data: newSettings
//     });
// });

// Get All Settings with query Filter Option
const getAll = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        GlobalSettings.find()
            .populate({
                path: 'logo',
                model: 'MediaContent',
                select: 'filePath altText'
            })
            .populate({
                path: 'favicon',
                model: 'MediaContent',
                select: 'filePath altText'
            }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const settingsList = await feature.query;

    let seoObj = {
        adsense: {},
        searchConsole: {},
        pinterest: {}
    }

    const seoStatusGAS = new APIFeature(GoogleAdSenseModel.find(), req.query)
        .filter()
        .limitFields();

    seoStatusGAS.query
        .then(gas => {
            console.log("gas:::", gas)
            seoObj.adsense = gas[0] || {}
        })
        .catch(err => {
            console.log("ERR:::", `${err?.name} ${err?.message}`)
        });
    const seoStatusGSC = new APIFeature(GoogleSearchConsoleModel.find(), req.query)
        .filter()
        .limitFields();

    seoStatusGSC.query
        .then(gsc => {
            console.log("gsc:::", gsc)
            seoObj.searchConsole = gsc[0] || {}
        })
        .catch(err => {
            console.log("ERR:::", `${err?.name} ${err?.message}`)
        });

    const seoStatusPV = new APIFeature(PinterestVerification.find(), req.query)
        .filter()
        .limitFields();

    seoStatusPV.query
        .then(pv => {
            console.log("pv:::", pv)
            seoObj.pinterest = pv[0] || {}
        })
        .catch(err => {
            console.log("ERR:::", `${err?.name} ${err?.message}`)
        });

    // get count
    const cQuery = new APIFeature(
        GlobalSettings.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([settingsList, cQuery]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: settingsList,
            seo: seoObj
        });
    });
});

// Get a Settings by id
const getById = catchAsync(async (req, res) => {
    const setting = await GlobalSettings.findOne({
        _id: req.params.id
    })
        .populate({
            path: 'logo',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        .populate({
            path: 'favicon',
            model: 'MediaContent',
            select: 'filePath altText'
        });

    res.status(200).json({
        status: 'success',
        data: setting
    });
});

// Update By Id
// const updateById = catchAsync(async (req, res) => {
//     const updatedSettings = await GlobalSettings.findByIdAndUpdate(
//         req.params.id,
//         req.body,
//         {
//             new: true,
//             runValidators: true
//         }
//     )
//         .populate({
//             path: 'logo',
//             model: 'MediaContent',
//             select: 'filePath altText'
//         })
//         .populate({
//             path: 'favicon',
//             model: 'MediaContent',
//             select: 'filePath altText'
//         });

//     res.status(200).json({ status: 'Success', data: updatedSettings });
// });

module.exports = {
    // createNew,
    getAll,
    getById,
    // updateById
};
