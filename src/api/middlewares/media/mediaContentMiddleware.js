const fs = require('fs');

// Load config
const config = require('./../../../../config/keys');
const DIR = config.MEDIA_ROOT;
const MAX_SIZE = parseInt(config.MEDIA_LIMIT) * 1024 * 1024; // size in Byte

// Load Utils
const catchAsync = require('./../../../utils/error/catchAsync');
const AppError = require('./../../../utils/error/appError');
const dataFormater = require('./../../../utils/dataFormate');
const validator = require('./../../../utils/validator');
const LOGGER = require('./../../../../config/logger');

// Load Model
const MediaContent = require('./../../../models/media/mediaContentModel');
const SubscriberConfig = require('../../../models/config/subscriberConfigModel');
const { formatBytes } = require('../../../utils/helper');

// middleware to slugify fileName
const setMediaContent = (req, res, next) => {
    // get variables
    const excelFileFormats = [
        'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'vnd.openxmlformats-officedocument.spreadsheetml.template',
        'vnd.ms-excel',
        'vnd.oasis.opendocument.spreadsheet'
    ];
    const file = req.body.files?.file[0];

    if (validator.isEmptyObject(file))
        return next(new AppError(`Nothing to upload`, 400));
    else {
        var re = /(?:\.([^.]+))?$/;
        const contentType = file['headers']['content-type'];
        const contentTypeList = contentType
            ? contentType.split('/')
            : undefined;

        if (contentTypeList[0] === 'application')
            if (excelFileFormats.includes(contentTypeList[1]))
                mediaType = 'excel';
            else mediaType = contentTypeList[1];
        else if (contentType === 'text/csv') mediaType = 'csv';
        else mediaType = contentTypeList[0];

        const path = file['path'];
        req.file = {
            contentType,
            mediaType,
            extension: path ? re.exec(path)[1] : undefined,
            size: file.size,
            path
        };

        req.body['contentType'] = contentType;
        req.body['size'] = file.size;
        next();
    }
};

// check media type
const validateMediaType = (req, res, next) => {
    const mediaTypeBody = req.body?.mediaType;
    const mediaTypeFile = req.file?.mediaType;

    if (mediaTypeBody.toLowerCase() !== mediaTypeFile.toLowerCase()) {
        LOGGER.error(
            `Passing type '${mediaTypeFile}' and expected type '${mediaTypeBody}' doesn't matched!`
        );
        return next(
            new AppError(
                `System expect '${mediaTypeBody}' but you are passing '${mediaTypeFile}' type file`,
                400
            )
        );
    } else next();
};

// middleware to validate file size
const validateFileSize = (req, res, next) => {
    let { size } = req.body;
    size = parseInt(size);
    console.log('size', size);
    if (size > MAX_SIZE)
        return next(
            new AppError(`Media file should be less than 50 MB in size`, 400)
        );
    next();
};

/* middleware to generate business wise directory.
For business it will be by domain slug and for super admin folder name will be superadmin
*/
const setAndCreatePath = (req, res, next) => {
    const code = req.code;
    const { mediaType } = req.file;

    const url = `${DIR}/${code}/${mediaType}`;
    const filePath = `${code}/${mediaType}`;

    req.file['url'] = url;
    req.file['filePath'] = filePath;

    if (!fs.existsSync(url)) {
        fs.mkdirSync(url, { recursive: true });
    }

    next();
};

// generate Slug with fileName
const generateFileSlug = catchAsync(async (req, res, next) => {
    // get variables
    let { fileName } = req.body;

    // generate slug with fileName
    slug = await dataFormater.generateSlug(fileName);

    req.file['slug'] = slug;

    next();
});

// middleware to set filename. if file already exist then add number suffix
const setFileName = catchAsync(async (req, res, next) => {
    // let { slug } = req.body;
    const { slug, url, filePath, extension } = req.file;
    let name = `${url}/${slug}.${extension}`;

    if (fs.existsSync(name)) {
        const uId = await dataFormater.generateUniqueNumber(8, false, true);
        req.body.fileName = `${slug}-${uId}`;
        req.body.filePath = `${filePath}/${slug}-${uId}.${extension}`;
        req.file['fileName'] = `${slug}-${uId}.${extension}`;
    } else {
        req.body.fileName = slug;
        req.body.filePath = `${filePath}/${slug}.${extension}`;
        req.file['fileName'] = `${slug}.${extension}`;
    }

    next();
});

// middleware to check if id is valid or not
const checkValidId = (req, res, next) => {
    const id = req.params.id;
    validator
        .isValidId(MediaContent.findOne({ _id: id }), id)
        .then(doc => {
            req.filePath = doc?.filePath;
            req.size = parseInt(doc?.size);
            req.adminType = doc?.adminType;
            req.franchiseeId = doc?.franchiseeId;
            next();
        })
        .catch(() => next(new AppError('Invalid Id', 404)));
};

// middleware to check hosting limit for user
const checkHostingSpace = async (req, res, next) => {
    const { adminType } = req?.body
    const file = req.file;
    const franchiseeId =
        req.body.franchiseeId ||
        req.query.franchiseeId ||
        req.params.franchiseeId;

    let condition = {};
    if (adminType === 'CA')
        condition = { adminType: 'CA', franchiseeId };
    else condition = { adminType: 'SA' };

    const subscriberConfig = await SubscriberConfig.findOne(condition).lean();

    const getUserTotalHosting = subscriberConfig?.attributes?.filter(item => item?.attributeType == 'space')

    // console.log("getUserTotalHosting:::", getUserTotalHosting);
    // console.log("req.file:::", file);
    // console.log("req.file.compare:::", formatBytes(subscriberConfig?.spaceUsages + file?.size), Number(getUserTotalHosting && getUserTotalHosting[0]?.value));

    if (subscriberConfig) {
        if (formatBytes(subscriberConfig?.spaceUsages + file?.size) >= Number(getUserTotalHosting && getUserTotalHosting[0]?.value)) {
            return next(new AppError('No free space available', 400))
        }
        else {
            next()
        }
    }
    else {
        return next(new AppError('Subscription is not assigned', 400))
    }
}

module.exports = {
    setMediaContent,
    validateMediaType,
    validateFileSize,
    setAndCreatePath,
    generateFileSlug,
    setFileName,
    checkValidId,
    checkHostingSpace
};
