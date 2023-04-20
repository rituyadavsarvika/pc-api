const AppError = require('../../utils/error/appError');

const handleCastErrorDB = err => {
	const message = `Invalid ${err.path}: ${err.value}`;
	return new AppError(message, 400);
};

const handleDuplicateFieldErrorDB = err => {
	const error = err.keyValue;
	const value = error.name || error.email || error.domainKey;
	const message = `Duplicate field value \"${value}\". Please use another value!`;
	return new AppError(message, 400);
};

const handleDateError = err => {
	const message = `${err.path} is ${err.stringValue}`;
	return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
	const errors = Object.values(err.errors).map(el => el.message);
	const message = `Invalid input data ${errors.join('. ')}`;
	return new AppError(message, 400);
};

const handleJWTError = err => {
	new AppError('Invalid token. Please login again !', 401);
};

const handleJWTExpiredError = err => {
	new AppError('Your token has been expired. Please login again', 401);
};

const sendErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack
	});
};

const sendErrorProd = (err, res) => {
	// Operational or trusted error: send message to client
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			message: err.message
		});
	} else {
		// Programming or some unknown error: don't send to client
		res.status(500).json({
			status: 'error',
			message: 'Something went very wrong'
		});
	}
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(err, res);
	} else if (process.env.NODE_ENV === 'production') {
		let error = { ...err };
		if (error.name === 'CastError') error = handleCastErrorDB(error);
		if (error.code === 11000) error = handleDuplicateFieldErrorDB(error);
		if (error._message === 'Validation failed')
			error = handleValidationErrorDB(error);
		if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
		if (error.name === 'TokenExpiredError')
			error = handleJWTExpiredError(error);
		if (error.kind === 'date') error = handleDateError(error);
		sendErrorProd(error, res);
	}
};
