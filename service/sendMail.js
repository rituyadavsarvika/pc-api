const fs = require('fs');
// const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const crypto = require('crypto');
const htmlPdf = require('html-pdf');
const path = require('path');

const config = require('./../config/keys');
const mailConfig = require('./../config/mailConfig');
const catchAsync = require('../src/utils/error/catchAsync');

// load model
const UserVerification = require('./../src/models/auth/userVerification.model');
const Franchisee = require('../src/models/franchisee/franchiseeModel');
const mongoose = require('mongoose');

const htmlToPdfBuffer = htmlFile => {
    return new Promise((resolve, reject) => {
        htmlPdf.create(htmlFile).toBuffer((err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });
};

const sendEMail = options => {
    // console.log("options:::", options);
    return new Promise((resolve, reject) => {
        mailConfig
            .getTransporter()
            .then(transporter => {
                transporter.sendMail(options, (error, info) => {
                    if (error) {
                        reject({
                            status: 'fail',
                            message: `${error}`
                        });
                    } else {
                        resolve({
                            status: 'success',
                            message: 'send successfully'
                        });
                    }
                });
            })
            .catch(err => reject());
    });
};

// resetPasswordRequestMail mail
const resetPasswordRequestMail = async (userObj, token, payload) => {
    let getDomainSlug = await Franchisee.findOne({ _id: mongoose.Types.ObjectId(userObj?.franchiseeId) })
    let link = ''
    if (getDomainSlug?.domainSlug) {
        link = `${config.PROTOCOL}:\/\/${getDomainSlug?.domainSlug}.${config.FRONT_URL.HOST}/reset-password?token=${token}&id=${userObj.userId}`
    }
    else if (getDomainSlug?.domain) {
        link = `${config.PROTOCOL}:\/\/${getDomainSlug?.domain}/reset-password?token=${token}&id=${userObj.userId}`
    }
    else {
        link = `${config.PROTOCOL}:\/\/${config.FRONT_URL.HOST}/reset-password?token=${token}&id=${userObj.userId}`
    }

    // TODO: have to replace https to https after deploy
    // const link = `${config.FRONT_URL.HOST}/reset-password?token=${token}&id=${userObj.userId}`;
    payload.link = link;

    // const filePath =
    //     __dirname + '/../src/utils/templates/requestResetPassword.handlebars';

    // const source = fs.readFileSync(filePath, 'utf8');
    // const compiledTemplate = handlebars.compile(source);

    // const options = {
    //     from: mailConfig.mailFrom,
    //     to: userObj.email,
    //     subject: 'Password Reset Request',
    //     html: compiledTemplate(payload)
    // };

    const filePath = __dirname + '/../src/utils/templates/requestResetPasswordTemplate.html';

    let source = fs.readFileSync(filePath, 'utf8');
    // let adminPanelUrl = link + '/admin'
    // replace user information in email body
    source = source.replace(/user_id/g, userObj.userId);
    source = source.replace(/user_name/g, payload.name);
    source = source.replace(/reset_password_url/g, link);
    // source = source.replace(/website_url/g, link);
    // source = source.replace(/admin_panel_url/g, adminPanelUrl);

    const options = {
        from: mailConfig.mailFrom,
        to: userObj.email,
        subject: 'Password Reset Request',
        html: source
    };

    // console.log("source:::", source);

    // send mail
    sendEMail(options)
        .then(() => { })
        .catch(err => { });
};

const resetPasswordResetSuccessMail = userObj => {
    return new Promise((resolve, reject) => {
        const filePath =
            __dirname + '/../src/utils/templates/resetPassword.handlebars';

        const source = fs.readFileSync(filePath, 'utf8');
        const compiledTemplate = handlebars.compile(source);

        const options = {
            from: mailConfig.mailFrom,
            to: userObj.email,
            subject: 'Password Reset Successfully',
            html: compiledTemplate(userObj)
        };

        // send mail
        sendEMail(options)
            .then(() => resolve())
            .catch(err => reject());
    });
};

// account verification email
const singUpMail = (userObj, link) => {
    return new Promise((resolve, reject) => {
        const filePath = __dirname + '/../src/utils/templates/welcomeEmailTemplate.html';

        let source = fs.readFileSync(filePath, 'utf8');
        let adminPanelUrl = link + '/admin'
        // replace user information in email body
        source = source.replace(/user_id/g, userObj.userId);
        source = source.replace(/user_name/g, userObj.name);
        source = source.replace(/admin_url/g, link);
        source = source.replace(/website_url/g, link);
        source = source.replace(/admin_panel_url/g, adminPanelUrl);

        const options = {
            from: mailConfig.mailFrom,
            to: userObj.email,
            subject: 'Registration Success Mail',
            html: source
        };

        // send mail
        sendEMail(options)
            .then(response => {
                // if (response.status === 'success') {
                resolve();
                // } else {
                //     reject();
                // }
            })
            .catch(err => {
                resolve();
                // reject(err);
            });
    });
};

// Generate account verification link
const generateVerification = catchAsync(async (userId, email, name) => {
    await UserVerification.deleteOne({ email });
    // if (verification) await verification.deleteOne();

    let verificationToken = crypto.randomBytes(32).toString('hex');

    // create new Verification document
    await new UserVerification({
        userId,
        email,
        token: verificationToken,
        createdAt: Date.now()
    }).save();

    // generate mail
    const link = `${config.URL}/v1/auth/verification/verify-account?token=${verificationToken}&id=${userId}`;

    await singUpMail({ userId, email, name }, link);
});

// order Confirmation Mail
const orderMailNotification = orderObject => {
    return new Promise((resolve, reject) => {
        var templateHtml = fs.readFileSync(
            path.join(process.cwd(), './src/utils/templates/invoice.html'),
            'utf8'
        );
        var template = handlebars.compile(templateHtml);
        var finalHtml = template(orderObject);
        // var pdfOptions = {
        // 	format: 'A4',
        // 	headerTemplate: '<p></p>',
        // 	footerTemplate: '<p></p>',
        // 	displayHeaderFooter: false,
        // 	margin: {
        // 		top: '40px',
        // 		bottom: '100px'
        // 	},
        // 	printBackground: true,
        // 	path: 'invoice.pdf'
        // };

        htmlPdf.create(finalHtml, pdfOptions).toBuffer(function (err, buffer) {
            const options = {
                from: mailConfig.mailFrom,
                to: orderObject.email,
                subject: 'Order Confirmation Mail',
                html: finalHtml
                // attachments: {
                // 	filename: 'invoice.pdf',
                // 	content: buffer
                // }
            };

            // send mail
            sendEMail(options)
                .then(response => {
                    if (response.status === 'success') {
                        resolve();
                    } else {
                        reject();
                    }
                })
                .catch(err => {
                    reject();
                });
        });
    });
};

// Order status change mail notifications
const sendStatusChangeEmail = (name, email, orderId, status) => {
    // generate mailBody
    const body = `
	<body>
		Dear ${name},
		<br>
			Your Order<b>#${orderId}</b> status has been changed to <b>${status}</b>

			<br><br>
			Thanks <br>
			Team GYT
	</body>
	`;

    // generate email object
    const options = {
        from: mailConfig.mailFrom, // Sender address
        to: email, // recipient address
        subject: 'Order status change notification', // Subject line
        html: body // Html text body
    };

    return new Promise((resolve, reject) => {
        mailConfig
            .getTransporter()
            .then(transporter => {
                transporter.sendMail(options, (error, info) => {
                    if (error) {
                        reject({
                            status: 'fail',
                            message: `${error}`
                        });
                    } else {
                        resolve({
                            status: 'success',
                            message: 'send successfully'
                        });
                    }
                });
            })
            .catch(err => reject());
    });
};

// Send Contact Email
const sendContactEmail = (
    toEmailList,
    messageBody,
    attachedFiles,
    franchiseeId
) => {
    return new Promise((resolve, reject) => {
        let body = '';
        let mailBody =
            '<h5>Someone is trying to contact with following information</h5>';

        for (const property in messageBody) {
            body = `${body} <p>${property}: ${messageBody[property]}</p>`;
        }

        mailBody = mailBody + body;

        // generate email object
        const options = {
            // from: fromEmail, // Sender address
            to: toEmailList, // recipient address list
            subject: 'Contact Mail Prolific Cloud', // Subject line
            html: mailBody, // Html text body
            attachments: attachedFiles
        };

        mailConfig
            .getTransporter(franchiseeId)
            .then(transporter => {
                options['from'] = transporter?.options?.auth?.user;
                transporter.sendMail(options, (error, info) => {
                    if (error) {
                        reject({
                            status: 'fail',
                            message: error
                        });
                    } else {
                        resolve({
                            status: 'success',
                            message: 'send successfully'
                        });
                    }
                });
            })
            .catch(err => reject());
    });
};

// const getMailConfig = catchAsync(async (role, businessId, franchiseeId) => {
// 	let config = {};
// 	let business;
// 	if (role) {
// 		if (role === 'SUPERADMIN')
// 			config = await MailConf.findOne({ adminType: 'SA' }).select(
// 				'+smtpPass'
// 			);
// 		else if (role === 'CITYADMIN') {
// 			config = await MailConf.findOne({
// 				adminType: 'CA',
// 				franchiseeId
// 			}).select('+smtpPass');
// 		} else {
// 			business = await Business.findOne({ _id: businessId });
// 			if (business) {
// 				config = await MailConf.findOne({
// 					adminType: 'CA',
// 					franchiseeId: business.franchiseeId
// 				}).select('+smtpPass');
// 			}
// 		}
// 	}

// 	Promise.all([config, business]).finally(() => {
// 		if (config) {
// 			return config;
// 		} else {
// 			MailConf.findOne({ adminType: 'SA' })
// 				.select('+smtpPass')
// 				.then(data => {
// 					return data;
// 				});
// 		}
// 	});
// });

module.exports = {
    resetPasswordRequestMail,
    resetPasswordResetSuccessMail,
    generateVerification,
    singUpMail,
    orderMailNotification,
    sendStatusChangeEmail,
    sendContactEmail
};
