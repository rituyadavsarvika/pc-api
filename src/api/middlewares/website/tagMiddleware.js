// Load Utils
const validator = require('./../../../utils/validator');
const catchAsync = require('./../../../utils/error/catchAsync');
const AppError = require('./../../../utils/error/appError');
const DataFormater = require('./../../../utils/dataFormate');

// Load model
const Tag = require('./../../../models/website/tagModel');

// middleware to generate slug with name
const generateSlug = catchAsync(async (req, res, next) => {
    let { name } = req.body;
    if (name) {
        slug = await DataFormater.generateSlug(name);
        req.body.slug = slug;
    }

    next();
});

// check if slug already exist or not. if exist then add a 8 digit number as a suffix
const setSlugField = catchAsync(async (req, res, next) => {
    const { slug, franchiseeId, adminType } = req.body;

    if ((slug, adminType)) {
        const { id } = req.params;
        const doc = await Tag.findOne({
            adminType,
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
    const { tagSlug } = req.params;
    const { franchiseeId } = req.query;

    const doc = await Tag.findOne({ slug: tagSlug, franchiseeId: franchiseeId });
    if (validator.isEmptyObject(doc))
        return res.status(200).json({ status: 'success', result: 0, data: [] });
    else {
        req.query.tags = doc._id;
        next();
    }
});

module.exports = { generateSlug, setSlugField, getIdFromSlug };
