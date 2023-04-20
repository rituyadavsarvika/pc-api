const validator = require('../../../../utils/validator');
const AppError = require('./../../../../utils/error/appError');
const catchAsync = require('./../../../../utils/error/catchAsync');

// Load Model
const Model = require('../../../../models/franchisee/business/shippingMethodModel');

/**
 * @description Middleware to control isDefault in the time of creation
 * @param {request} req
 * @param {response} res
 * @param {*} next
 */
const setDefault = (req, res, next) => {
    const { franchiseeId } = req.body;

    Model.findOne({
        franchiseeId
        // businessId
    })
        .then((data) => {
            if (validator.isEmptyObject(data)) req.body.isDefault = true;
            else req.body.isDefault = false;

            next();
        })
        .catch((err) => next(new AppError(err, 401)));
};

/**
 * @description pass undefined as isDefault value
 * @param {request} req
 * @param {response} res
 * @param {*} next
 */
const removeIsDefault = catchAsync(async (req, res, next) => {
    const method = await Model.findOne({ _id: req.params.id });
    req.body.isDefault = method.isDefault;
    next();
});
/**
 * @param  {asynchronous} async function
 * @param  {request} req
 * @param  {response} res
 * @description Middleware function to check if shipping method is default or not. if default then return with error
 */
const checkIsDefault = catchAsync(async (req, res, next) => {
    const shippingId = req.params.id;
    const shippingMethod = await Model.findOne({ _id: shippingId });
    if (!validator.isEmptyObject(shippingMethod) && shippingMethod.isDefault)
        res.status(405).json({
            status: 'fail',
            message: "You can't delete default shipping method."
        });
    else next();
});

const checkValidDefault = (req, res, next) => {
    const { isDefault } = req.body;

    if (isDefault) next();
    else
        next(
            new AppError('At least one shipping method must be default.', 400)
        );
};

module.exports = {
    setDefault,
    removeIsDefault,
    checkValidDefault,
    checkIsDefault
};
