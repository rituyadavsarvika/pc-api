const AppError = require('../../../../utils/error/appError');
const catchAsync = require('../../../../utils/error/catchAsync');
const validator = require('../../../../utils/validator');
const DataFormater = require('../../../../utils/dataFormate');

// Load Model
const VendorCategory = require('../../../../models/franchisee/business/vendorCategoryModel');

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.vendorCategoryId;

    validator
        .isValidId(VendorCategory.findOne({ _id: id }), id)
        .then(() => next())
        .catch(err => next(new AppError(err, 404)));
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
        const doc = await VendorCategory.findOne({
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
    const { vendorCategorySlug } = req.params;

    const doc = await VendorCategory.findOne({ slug: vendorCategorySlug });

    if (validator.isEmptyObject(doc))
        return res.status(200).json({ status: 'success', result: 0, data: [] });
    else {
        req.vendorCategoryId = doc._id;
        next();
    }
});

module.exports = { checkValidId, generateSlug, setSlugField, getIdFromSlug };
