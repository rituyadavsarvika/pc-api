// Load Utils
const sendMail = require('../../../service/sendMail');
const Validator = require('./../../utils/validator');

// Load Configuration
const config = require('../../../config/keys');
const mailConfig = require('./../../../config/mailConfig');

// send contact email
const sendContactMail = (req, res) => {
    const franchiseeId = req.body.franchiseeId;
    const body = { ...req.body };
    delete body['files']; // remove files from body
    delete body['adminType'];
    delete body['franchiseeId'];
    delete body['actions'];
    // mailConfig
    //     .getMailConfig(franchiseeId)
    //     .then(conf => {
    sendMail
        .sendContactEmail(
            req.body.actions,
            // conf.smtpUser,
            body,
            req.attachedFiles,
            franchiseeId
        )
        .then(() =>
            res.status(200).json({
                status: 'success',
                message: `Email successfully send to ${req.body.actions}`
            })
        )
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: err
                // `Email send failed`
            })
        );
    // })
    // .catch(() => {
    //     res.status(500).json({
    //         status: 'fail',
    //         message: 'No mail config found'
    //     });
    // });

    // res.status(200).json({
    //     status: 'success',
    //     toEmail: req.toEmail,
    //     body: body,
    //     attachments: req.attachedFiles
    // });

    // sendMail
    //     .sendContactEmail(req.toEmail, fromMail, body, req.attachedFiles)
    //     .then(() => {
    //         res.status(200).json({
    //             status: 'success',
    //             message: `Email successfully send to ${toEmail}`
    //         });
    //     })
    //     .catch(() => {
    //         res.status(500).json({
    //             status: 'fail',
    //             message: `Email send failed`
    //         });
    //     });
};

module.exports = { sendContactMail };
