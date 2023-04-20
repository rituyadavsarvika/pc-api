const slugify = require('slugify');

// Load utils
const AppError = require('../../../../utils/error/appError');
const catchAsync = require('./../../../../utils/error/catchAsync');
const validator = require('../../../../utils/validator');
const DataFormater = require('./../../../../utils/dataFormate');

// Load Model
const Product = require('./../../../../models/franchisee/business/productModel');

const checkIsMultiple = (req, res, next) => {
    const name = req.body.name;
    const franchiseeId = req.body.franchiseeId;

    const query = Product.findOne({
        name,
        franchiseeId
    });

    validator
        .isDuplicate(query, name, 'name')
        .then(() => next())
        .catch(err => next(new AppError(err, 409)));
};

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.productId;
    validator
        .isValidId(Product.findOne({ _id: id }), id)
        .then(() => next())
        .catch(err => next(new AppError(err, 404)));
};

const getExistingImage = catchAsync(async (req, res, next) => {
    const id = req.params.id;

    const product = await Product.findOne({
        _id: id
    });

    if (req.body.images) req.body.images.links = product?.images?.links;
    next();
});

const setProductSlug = catchAsync(async (req, res, next) => {
    const id = req.params.id;
    slug = slugify(req.body.name, { lower: true });
    const product = await Product.findOne({ slug });

    if (validator.isEmptyObject(product)) req.body.slug = slug;
    else req.body.slug = `${slug}-${id.slice(-5)}`;
    next();
});

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
    const { slug, franchiseeId } = req.body;

    if (slug && franchiseeId) {
        const { id } = req.params;
        const doc = await Product.findOne({
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

module.exports = {
    checkIsMultiple,
    checkValidId,
    getExistingImage,
    setProductSlug,
    generateSlug,
    setSlugField
};
