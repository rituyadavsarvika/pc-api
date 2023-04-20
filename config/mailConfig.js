const nodemailer = require('nodemailer');
const ValidateData = require('./../src/utils/validator');
// const catchAsync = require('../src/utils/error/catchAsync');
const mongoose = require('mongoose');

const MailConfig = require('./../src/models/outGoingMailConfigModel');

const getMailConfig = franchiseeId => {
    return new Promise((resolve, reject) => {
        MailConfig.findOne({ adminType: 'CA', franchiseeId, active: true })
            .select('+smtpPass')
            .then(subscriberConfig => {
                if (ValidateData.isEmptyObject(subscriberConfig))
                    return MailConfig.findOne({
                        adminType: 'SA',
                        active: true
                    }).select('+smtpPass');
                else return subscriberConfig;
            })
            .then(config => {
                if (!ValidateData.isEmptyObject(config)) resolve(config);
                else reject('No configuration found');
            })
            .catch(err => reject('No configuration found'));
    });

    // return new Promise((resolve, reject) => {

	// 	let queryObj = {
	// 		adminType: 'SA',
	// 		active: true,
	// 	}

	// 	if ((franchiseeId || franchiseeId != null)) {
	// 		queryObj.adminType = 'CA'
	// 		queryObj.franchiseeId = mongoose.Types.ObjectId(franchiseeId)
	// 	}

	// 	MailConfig.findOne(queryObj)
	// 		.select('+smtpPass')
	// 		.then(conf => resolve(conf))
	// 		.catch(() => reject());
	// });
};

const getTransporter = franchiseeId => {
    return new Promise((resolve, reject) => {
        getMailConfig(franchiseeId)
            .then(mailConfig => {
                if (mailConfig) {
                    const transporter = nodemailer.createTransport({
                        host: mailConfig.smtpHost,
                        port: parseInt(mailConfig.smtpPort),
                        secure: true,
                        auth: {
                            user: mailConfig.smtpUser,
                            pass: mailConfig.smtpPass
                        }
                    });
                    resolve(transporter);
                } else {
                    reject();
                }
            })
            .catch(err => reject('No Config found'));
    });
};

module.exports = {
    getTransporter,
    getMailConfig,
    mailFrom: 'support@prolificcloud.com'
};
