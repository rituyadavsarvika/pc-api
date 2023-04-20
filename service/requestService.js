const multiparty = require('multiparty');

// Load Error handler
const validator = require('./../src/utils/validator');

const parseMultipartyRequest = (req, res, next) => {
    const form = new multiparty.Form();
    form.parse(req, (error, fields, files) => {
        let body = {};

        // field list
        if (fields) {
            for (const field in fields) {
                body[field] = fields[field] ? fields[field][0] : undefined;
            }
        }

        // attach body to req object
        req.body = body;

        // files list
        if (!validator.isEmptyObject(files)) {
            req.body.files = files;
        }
        next();
    });
};

module.exports = {
    parseMultipartyRequest
};
