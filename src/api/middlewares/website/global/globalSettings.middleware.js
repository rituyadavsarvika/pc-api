const catchAsync = require('./../../../../utils/error/catchAsync');
const AppError = require('./../../../../utils/error/appError');
const validator = require('./../../../../utils/validator');

// Load Model
const GlobalSettings = require('../../../../models/website/global/globalSettings.model');

const checkValidId = catchAsync(async (req, res, next) => {
    const settingId = req.params.id;
    const setting = await GlobalSettings.findOne({ _id: settingId });
    if (!setting) {
        return next(new AppError('Invalid Settings Id', 404));
    } else {
        req.logo = setting.logo;
        next();
    }
});

const checkIsMultiple = (req, res, next) => {
    const adminType = req.body.adminType;
    const franchiseeId = req.body.franchiseeId;
    let query = undefined;

    if (adminType === 'CA') {
        query = GlobalSettings.findOne({
            adminType: 'CA',
            franchiseeId
        });
    } else if (adminType === 'SA') {
        query = GlobalSettings.findOne({ adminType: 'SA' });
        req.body.franchiseeId = undefined;
    } else return next(new AppError('Invalid data', 400));

    validator
        .isDuplicate(query, 'Record')
        .then(() => next())
        .catch(err => next(new AppError(err, 409)));
};

module.exports = {
    checkValidId,
    checkIsMultiple
};
