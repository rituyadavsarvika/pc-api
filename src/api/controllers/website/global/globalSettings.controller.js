// Load utils
const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');

// Load Model
const GlobalSettings = require('../../../../models/website/global/globalSettings.model');
const requestIp = require('request-ip');
const { getRequestIpAddress } = require('../../../../utils/request-utils');

// create New Global settings
const createNew = catchAsync(async (req, res) => {
    const newSettings = await GlobalSettings.create(req.body);
    res.status(201).json({
        status: 'success',
        data: newSettings
    });
});

const getIP = (req) => {
    // req.connection is deprecated
    const conRemoteAddress = req.connection?.remoteAddress
    // req.socket is said to replace req.connection
    const sockRemoteAddress = req.socket?.remoteAddress
    // some platforms use x-real-ip
    const xRealIP = req.headers['x-real-ip']
    // most proxies use x-forwarded-for
    const xForwardedForIP = (() => {
      const xForwardedFor = req.headers['x-forwarded-for']
      if (xForwardedFor) {
        // The x-forwarded-for header can contain a comma-separated list of
        // IP's. Further, some are comma separated with spaces, so whitespace is trimmed.
        const ips = xForwardedFor.split(',').map(ip => ip.trim())
        return ips[0]
      }
    })()
    // prefer x-forwarded-for and fallback to the others
    return xForwardedForIP || xRealIP || sockRemoteAddress || conRemoteAddress
  }

// Get All Settings with query Filter Option
const getAll = catchAsync(async (req, res) => {
    var clientIp = getRequestIpAddress(req)
    console.log("client IP is ---------- *********************", clientIp);

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
            data: settingsList
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
const updateById = catchAsync(async (req, res) => {
    const updatedSettings = await GlobalSettings.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    )
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

    res.status(200).json({ status: 'Success', data: updatedSettings });
});

module.exports = {
    createNew,
    getAll,
    getById,
    updateById
};
