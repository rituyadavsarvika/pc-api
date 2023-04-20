const AppError = require('./../../../../utils/error/appError');

// load model
const checkValidInput = (req, res, next) => {
    const { token, customerId } = req.body;

    if (!token.paymentMethodId || !customerId)
        return next(new AppError('Invalid token or customerId', 400));

    next();
};

module.exports = {
    checkValidInput
};
