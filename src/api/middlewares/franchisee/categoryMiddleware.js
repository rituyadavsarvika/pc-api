const AppError = require('./../../../utils/error/appError');
const catchAsync = require('../../../utils/error/catchAsync');
const validator = require('./../../../utils/validator');
const DataFormater = require('./../../../utils/dataFormate');

// Load Model
const ProductCategory = require('./../../../models/franchisee/categoryModel');

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.parentId;

    if (id) {
        validator
            .isValidId(ProductCategory.findOne({ _id: id }), id)
            .then(() => next())
            .catch(err => next(new AppError(err, 404)));
    } else {
        next();
    }
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
        const doc = await ProductCategory.findOne({
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

// get product category _id from product category slug
const getIdFromSlug = catchAsync(async (req, res, next) => {
    const { categorySlug } = req.params;
    const doc = await ProductCategory.findOne({ slug: categorySlug });
    console.log('doc', doc);
    if (validator.isEmptyObject(doc))
        return res.status(200).json({ status: 'success', result: 0, data: [] });
    else {
        req.query.categories = doc._id;
        next();
    }
});

module.exports = { checkValidId, generateSlug, setSlugField, getIdFromSlug };
