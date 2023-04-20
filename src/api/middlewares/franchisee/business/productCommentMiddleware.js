// Load Error handler
const AppError = require('../../../../utils/error/appError');
const validator = require('./../../../../utils/validator');

// Load Model
const Product = require('./../../../../models/franchisee/business/productModel');

const checkValidId = (req, res, next) => {
    const productId = req.body.productId;

    Product.findOne({ _id: productId })
        .select('slug')
        .then((product) => {
            // if no product found return
            if (validator.isEmptyObject(product))
                return next(new AppError('Invalid Product Id'));

            // if product document found
            req.productSlug = product.slug;
            next();
        })
        .catch((err) => next(new AppError(`${err.name} ${err.message}`, 500)));
};

module.exports = {
    checkValidId
};
