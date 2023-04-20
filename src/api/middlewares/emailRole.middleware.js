const AppError = require('./../../utils/error/appError');
const validator = require('./../../utils/validator');

// Load Model
const Model = require('./../../models/emailRoleRel.model');

const checkDuplicateEmail = (req, res, next) => {
    validator
        .isDuplicate(
            Model.findOne({ email: req.body.email }),
            req.body.email,
            'email'
        )
        .then(() => next())
        .catch((error) => {
            // next(
            //     new AppError(`User already created with ${req.body.email}`, 409)
            // )

            res.status(409).json({
                status: 'fail',
                message: `The email address is already in use. Use a different email.`,
                error,
            })
        });
};

module.exports = {
    checkDuplicateEmail
};
