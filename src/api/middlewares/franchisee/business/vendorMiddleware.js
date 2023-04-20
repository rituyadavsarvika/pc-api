const AppError = require('../../../../utils/error/appError');
const catchAsync = require('../../../../utils/error/catchAsync');
const validator = require('../../../../utils/validator');
const DataFormater = require('../../../../utils/dataFormate');

// Load Model
const Vendor = require('../../../../models/franchisee/business/vendorModel');

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.businessId;

    validator
        .isValidId(Vendor.findOne({ _id: id }), id)
        .then(() => next())
        .catch(err => next(new AppError(err, 404)));
};

const checkConditionalValidId = (req, res, next) => {
    const id = req.params.id || req.body.businessId;
    const adminType = req.body.adminType;

    if (adminType === 'BA') {
        validator
            .isValidId(Vendor.findOne({ _id: id }), id, 'businessId')
            .then(() => next())
            .catch(err => next(new AppError(err, 404)));
    } else next();
};

const checkDuplicateEmail = (req, res, next) => {
    validator
        .isDuplicate(
            Vendor.findOne({ email: req.body.email }),
            req.body.email,
            'email'
        )
        .then(() => next())
        .catch(err =>
            next(
                new AppError(
                    `Vendor already created with the email '${req.body.email}'`,
                    409
                )
            )
        );
};

// middleware to generate slug with name
const generateSlug = catchAsync(async (req, res, next) => {
    const { name } = req.body;

    if (name) {
        const slug = await DataFormater.generateSlug(name);
        req.body.slug = slug;
    }

    next();
});

// check if slug already exist or not. if exist then add a 8 digit number as a suffix
const setSlugField = catchAsync(async (req, res, next) => {
    const { slug, franchiseeId } = req.body;

    if (slug && franchiseeId) {
        const { id } = req.params;
        const doc = await Vendor.findOne({
            franchiseeId,
            slug,
            _id: { $ne: id }
        });
        if (!validator.isEmptyObject(doc)) {
            const uId = await DataFormater.generateUniqueNumber(2, false, true);
            req.body.slug = `${slug}-${uId}`;
        }
    }
    next();
});

// get tag _id from slug
const getIdFromSlug = catchAsync(async (req, res, next) => {
    const { vendorSlug } = req.params;

    const doc = await Vendor.findOne({ slug: vendorSlug });

    if (validator.isEmptyObject(doc))
        return res.status(200).json({ status: 'success', result: 0, data: [] });
    else {
        req.query.businessId = doc._id;
        next();
    }
});

// get all vendor under a specific category
const getVendorListByCategory = catchAsync(async (req, res, next) => {
    const vendorCategoryId = req.vendorCategoryId;
    const docs = await Vendor.find({ categoryIds: vendorCategoryId }).select(
        '_id'
    );

    if (!docs || docs.length < 1)
        return res.status(200).json({ status: 'success', result: 0, data: [] });
    else {
        let businessIdList = [];
        docs.map(doc => {
            businessIdList.push(doc._id.toString());
        });

        req.query.businessId = {
            $in: businessIdList
        };
        next();
    }
});

module.exports = {
    checkValidId,
    checkConditionalValidId,
    checkDuplicateEmail,
    generateSlug,
    setSlugField,
    getIdFromSlug,
    getVendorListByCategory
};
