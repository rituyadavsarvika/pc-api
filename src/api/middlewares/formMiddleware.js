// Load Utils
const catchAsync = require('../../utils/error/catchAsync');
const AppError = require('../../utils/error/appError');
const validator = require('../../utils/validator');
const keys = require('../../../config/keys');

// Load Model
const Franchisee = require('../../models/franchisee/franchiseeModel');

// Validate request Data
const validateData = (req, res, next) => {
    const { actions } = req.body;
    if (!actions || actions.length < 1)
        return next(new AppError('No recipients defined', 400));
    next();
};

// get toEmail address
const getToEmail = catchAsync(async (req, res, next) => {
    const { adminType, franchiseeId } = req.body;

    if (adminType.toUpperCase() === 'SA') {
        req.toEmail = keys.toEmail;
    } else {
        const franchiseeDoc = await Franchisee.findOne({ _id: franchiseeId });
        req.toEmail = franchiseeDoc.email;
    }
    next();
});

// function to generate attachments
const generateAttachments = (req, res, next) => {
    const files = req.body.files;
    let attachedFiles = [];
    if (!validator.isEmptyObject(files)) {
        for (const [key, value] of Object.entries(files)) {
            const attachData = {
                filename: value[0].originalFilename,
                path: value[0].path
            };

            attachedFiles.push(attachData);
        }
    }

    req.attachedFiles = attachedFiles;

    next();
};

module.exports = {
    validateData,
    getToEmail,
    generateAttachments
};
