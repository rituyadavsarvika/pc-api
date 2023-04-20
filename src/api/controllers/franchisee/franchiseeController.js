const fs = require('fs');
// const { exec } = require('child_process');
const util = require('node:util');
// const exec = util.promisify(require('node:child_process').exec);
const LOGGER = require('./../../../../config/logger');

// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');
const config = require('./../../../../config/keys');
// const DATEUTILS = require('./../../../utils/dateTime');
const DataFormater = require('./../../../utils/dataFormate');
const Validator = require('./../../../utils/validator');

// Load Model
const userModel = require('../../../models/auth/usersModel');
const EmailRoleRel = require('./../../../models/emailRoleRel.model');
const franchiseeModel = require('./../../../models/franchisee/franchiseeModel');
// const Vendor = require('./../../../models/franchisee/business/vendorModel');
// const ShippingMethod = require('./../../../models/franchisee/business/shippingMethodModel');

// Load Service
const emailService = require('../../../../service/sendMail');
const subscriberService = require('../../../../service/subscriberConfigService');
const franchiseeService = require('./../../../../service/franchiseeService');
const keys = require('../../../../config/keys');
const dns = require('dns');
var ip = require('ip');
const { domainExistanceHandler } = require('../../../utils/helper');
const fsPromise = require('fs/promises');
const AppError = require('../../../utils/error/appError');
const SubscriberConfig = require('../../../models/config/subscriberConfigModel');
const { PROTOCOL } = require('./../../../../config/keys');


// Register Franchisee with city admin
const registerFranchisee = (req, res) => {
    delete req.body['stripeCustomerId'];

    let {
        name,
        email,
        password,
        confirmPassword,
        address,
        phone,
        domainKey,
        domainSlug,
        generatedDomain,
        domain,
        industryType,
        image,
        subscriptionPlanId
    } = req.body;

    // sanitize image
    if (image === '') image = undefined;

    let { planType, offerPrice, attributes } = req;

    offerPrice = parseFloat(offerPrice);

    // create email role rel document
    EmailRoleRel.create({
        email,
        userRole: 'SUBSCRIPTIONOWNER'
    })
        .then(() => {
            LOGGER.info(`Email role created for mail ${email}`);
            return franchiseeModel.create({
                name,
                phone,
                email: email,
                address,
                domainKey,
                domainSlug,
                generatedDomain,
                domain,
                image,
                industryType
            });
        })
        .then(newFranchisee => {
            LOGGER.info(`Franchisee created for mail ${email}`);
            franchiseeService.createHomePage(name, newFranchisee._id);
            return newFranchisee;
        })
        .then(newFranchisee => {
            LOGGER.info(`Home page created for franchisee ${name}`);
            const subscriberConfig = subscriberService.createNew(
                newFranchisee._id,
                subscriptionPlanId,
                planType,
                attributes,
                offerPrice
            );
            return Promise.all([subscriberConfig, newFranchisee]);
        })
        .then(([subscriberConfig, newFranchisee]) => {
            LOGGER.info(`Subscriber Config created for franchisee ${name}`);
            const newSubscriptionOwner = userModel.create({
                firstName: name,
                email,
                role: 'SUBSCRIPTIONOWNER',
                password,
                confirmPassword,
                address,
                phone,
                status: offerPrice === 0.0 ? 'SUBSCRIBED' : 'PAYMENT_PENDING',
                franchiseeId: newFranchisee._id,
                subscriptionExpireAt: subscriberConfig.subscriptionExpireAt,
                needCheckout: offerPrice > 0.0 ? true : false
            });
            return Promise.all([newSubscriptionOwner, newFranchisee]);
        })
        .then(([newSubscriptionOwner, newFranchisee]) => {
            LOGGER.info(
                `Subscription owner created for franchisee ${name} and email ${email}`
            );
            res.status(201).json({
                status: 'success',
                id: newSubscriptionOwner._id,
                email,
                name,
                franchiseeId: newFranchisee._id,
                role: newSubscriptionOwner.role,
                generatedDomain: newFranchisee?.generatedDomain,
                subscriptionPlanId
            });

            let link = `${PROTOCOL}://${generatedDomain}`;
            return emailService.singUpMail(
                { userId: newSubscriptionOwner._id, name, email },
                link
            );
        })
        .then(() => {
            LOGGER.info(`Admin url link send as mail to ${email}`);
            console.log('Signup Mail send done');
        })
        .catch(
            catchAsync(async err => {
                LOGGER.error(err);

                // delete created doc to rollback
                await EmailRoleRel.deleteOne({ email });
                await franchiseeModel.deleteOne({ email });
                await userModel.deleteOne({ email });

                res.status(500).json({
                    status: 'fail',
                    message: `${err?.name} ${err?.message}`
                });
            })
        );
};


// Register Franchisee with city admin
const createFranchisee = (req, res) => {
    delete req.body['stripeCustomerId'];
    let {
        name,
        email,
        address,
        phone,
        domainKey,
        domainSlug,
        generatedDomain,
        domain,
        industryType,
        image,
        // subscriptionPlanId
    } = req.body;

    // sanitize image
    if (image === '') image = undefined;

    let { planType, offerPrice, attributes } = req;

    offerPrice = parseFloat(offerPrice);

    franchiseeModel.create({
        name,
        phone,
        email: email,
        address,
        domainKey,
        domainSlug,
        generatedDomain,
        domain,
        image,
        industryType
    })
        .then(newFranchisee => {
            LOGGER.info(`Franchisee created for mail ${email}`);
            franchiseeService.createHomePage(name, newFranchisee._id);
            // return newFranchisee;
            LOGGER.info(
                `Subscription owner created for franchisee ${name} and email ${email}`
            );
            return newFranchisee;
        })
        .then(async newFranchisee => {
            LOGGER.info(`Subscriber Config created for franchisee ${name}`);
            const userInfo = await userModel.findOne({
                email: email
            })
            await userModel.updateOne({ _id: userInfo._id }, {
                $push: {
                    "subscriptionInfo.subscription": { subscriberId: newFranchisee._id, roleId: '1' }
                }
            })
            res.status(201).json({
                status: 'success',
                email,
                name,
                franchiseeId: newFranchisee._id,
                generatedDomain: newFranchisee?.generatedDomain,
            });
        })
        .catch(
            catchAsync(async err => {
                console.log(err);
                LOGGER.error(err);
                // delete created doc to rollback
                await franchiseeModel.deleteOne({ email });
                res.status(500).json({
                    status: 'fail',
                    message: `${err?.name} ${err?.message}`
                });
            })
        );
};


// Get all franchisees
const getAllFranchisees = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        franchiseeModel.find().populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const franchisee = await feature.query;

    // get count
    const cQuery = new APIFeature(
        franchiseeModel.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([franchisee, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: franchisee
        });
    });
});

// get specific franchisee by id
const getFranchisee = catchAsync(async (req, res) => {

    const franchisee = await franchiseeModel
        .findOne({ _id: req.params.id })
        .select('+stripeCustomerId')
        .populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        .lean();

    res.status(200).status(200).json({
        status: 'success',
        data: {
            ...franchisee,
            serverIp: ip.address()
        }
    });
});

// deletefranchisee from user
const deleteFranchisee = catchAsync(async (req, res) => {
    const user = await userModel
        .findOne({ email: req.email })
    const deletedItem = await userModel.updateOne(
        { _id: user._id },
        { $pull: { "subscriptionInfo.subscription": { subscriberId: req.params.id } } }
    );

    res.status(200).status(200).json({
        status: 'success',
        data: deletedItem
    });
});

// get specific franchisee by id
const getFranchiseeByEmail = catchAsync(async (req, res) => {
    const franchisee = await franchiseeModel
        .find({ email: req.email })
        .select('+stripeCustomerId')
        .populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        });

    res.status(200).status(200).json({
        status: 'success',
        data: franchisee
    });
});

// update franchisee
const updateFranchisee = async (req, res) => {
    const { domain, domainSlug } = req.body

    let lookupRes = await lookup(domain)
    const data = await franchiseeModel.findOne({ _id: req.params.id });
    if (lookupRes && lookupRes != ip.address()) {
        req.body.domain = data.domain

        if (domain !== data.domain) {
            const getSubscriberByDoamin = await franchiseeModel.findOne({
                // _id: { $ne: id },
                // domain: { $ne: domain },
                $and: [{ domain: {$ne: ""} }, { domain:{ $eq: domain} }]
            })

            if (domain === getSubscriberByDoamin?.domain) {
                return new AppError(
                    `Doamin Exist`,
                    409
                )
            }
        }
    }

    delete req.body['code'];

    if (!domain || domain == '' || domain == null) {
        console.log(data.domain, '------->');
        if (data.domain) {
            //delete existing nginx file
            fsPromise.unlink(`${config.NGINX_CONFIG_URL}/${data.domain}`)
        }
    }
    else if (domain && data.domain == '') {
        console.log('----->', lookupRes, ip.address());
        if (lookupRes == ip.address()) {
            await domainExistanceHandler(domain, domainSlug)
        }
    }
    else if (domain && domain != data.domain) {
        fsPromise.unlink(`${config.NGINX_CONFIG_URL}/${data.domain}`)
        // //new to save new ngnix file
        await domainExistanceHandler(domain, domainSlug)

    }

    // await SubscriberConfig.updateOne(
    //     { franchiseeId: req.params.id },
    //     { $set: { 'customDomain.domain': domain } }
    // );

    franchiseeModel
        .findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
        .populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        // .then(updatedFranchisee => {
        //     const { domain } = req.body;
        //     if (domain) {
        //         const configFile = `${domain}.conf`;
        //         const configDir = `${config.NGINX_CONFIG_URL}/${configFile}`;

        //         if (!fs.existsSync(configDir)) {
        //             // load config template
        //             const configContentPath =
        //                 __dirname +
        //                 '/../../../utils/templates/serverConfig.conf';

        //             let configContent = fs.readFileSync(configContentPath, {
        //                 encoding: 'utf8'
        //             });

        //             // generating SSL using lets encrypt
        //             exec(
        //                 `sudo certbot certonly --nginx -d ${domain}`,
        //                 (err, stdout, stderr) => {
        //                     console.log(err);
        //                     console.log(stdout);
        //                     console.log(stderr);
        //                     if (err) {
        //                         console.log(err);
        //                     }
        //                 }
        //             );

        //             configContent = configContent.replace(/domain/g, domain);
        //             fs.writeFile(configDir, configContent, function (err) {
        //                 if (err) {
        //                     console.log(err);
        //                 }

        //                 exec(
        //                     'sudo service nginx restart',
        //                     (err, stdout, stderr) => {
        //                         console.log(stdout);
        //                         console.log(stderr);
        //                         if (err) {
        //                             console.log(err);
        //                         }
        //                     }
        //                 );
        //             });
        //         }
        //     }

        //     return updatedFranchisee;
        // })
        .then(async updatedFranchisee => {
            const { domain, domainSlug } = req.body;
            if (domain) {
                // console.log("domainExistanceHandler Start:::");
                const domainHandler = await domainExistanceHandler(domain, domainSlug)
                // console.log("domainExistanceHandler End & Return:::", domainHandler);
                return { updatedFranchisee, ...domainHandler }
                //     let domainCheckErr = {
                //         address: '',
                //         records: '',
                //         domainInfo: ''
                //     }

                //     console.log('================================================')
                //     console.log('Domain:::', domain)

                //     const options = {
                //         // Setting family as 4 i.e. IPv4
                //         family: 4,
                //         hints: dns.ADDRCONFIG | dns.V4MAPPED,
                //     };

                //     let lookupRes = await lookup(domain)

                //     let recordRes = await records(domain)

                //     console.log('lookupRes:::', lookupRes)
                //     console.log('recordRes:::', recordRes)

                //     if (lookupRes) {
                //         console.log('=== Lookup IF')
                //     }
                //     else {
                //         console.log('=== Lookup ELSE')
                //         domainCheckErr.address = lookupRes
                //         domainCheckErr.domainInfo = "Address not found"
                //     }

                //     if (recordRes?.length > 0) {
                //         console.log('=== Record IF')
                //     }
                //     else {
                //         console.log('=== Record ELSE')
                //         domainCheckErr.records = recordRes
                //         domainCheckErr.domainInfo = "Hosting not found"
                //     }

                //     if (lookupRes && recordRes?.length == 0) {
                //         domainCheckErr.domainInfo = "Domain Exist but Hosting not found"

                //         const configFile = `${domain}`;
                //         const configDir = `${keys.NGINX_CONFIG_URL}/${configFile}`;

                //         if (!fs.existsSync(configDir)) {
                //             // load config template
                //             const configContentPath =
                //                 __dirname +
                //                 '/../../../utils/templates/serverConfigNew.conf';

                //             let configContent = fs.readFileSync(configContentPath, {
                //                 encoding: 'utf8'
                //             });

                //             // generating SSL using lets encrypt
                //             // exec(
                //             //     `sudo certbot certonly --nginx -d ${domain}`,
                //             //     (err, stdout, stderr) => {
                //             //         console.log(err);
                //             //         console.log(stdout);
                //             //         console.log(stderr);
                //             //         if (err) {
                //             //             console.log(err);
                //             //         }
                //             //     }
                //             // );

                //             configContent = configContent.replace(/\$domain/g, domain);

                //             console.log("configContent:::", configContent);
                //             fs.writeFile(configDir, configContent, async function (err) {
                //                 if (err) {
                //                     console.log(err);
                //                 }

                //                 // exec(
                //                 //     'sudo nginx -s reload',
                //                 //     (err, stdout, stderr) => {
                //                 //         console.log("stdout:::", stdout);
                //                 //         console.log("stderr", stderr);
                //                 //         if (err) {
                //                 //             console.log("err:::", err);
                //                 //         }
                //                 //     }
                //                 // );

                //                 // const { stdout, stderr } = await exec('sudo nginx -s reload');
                //                 // console.log('stdout:::', stdout);
                //                 // console.error('stderr:::', stderr);

                //                 await exec('sudo nginx -s reload -t')
                //                     .then(resp => {
                //                         console.log('resp:::', resp);
                //                     })
                //                     .catch(err => {
                //                         console.log('err:::', err);
                //                     })
                //             });
                //         }
                //     }
                //     else if (lookupRes && recordRes?.length > 0) {
                //         domainCheckErr.domainInfo = "Domain & Hosting Exist"
                //     }

                //     return { updatedFranchisee, domainCheckErr, lookupRes, recordRes };
            }
            else {
                return { updatedFranchisee };
            }
            // return { updatedFranchisee, domainCheckErr };
        })
        .then((updatedFranchisee, domainCheckErr, lookupRes) => {
            res.status(200).json({
                status: 'success',
                data: { updatedFranchisee, domainCheckErr, lookupRes }
            });
        })
        .catch(err =>
            res
                .status(500)
                .json({ status: 'fail', message: `${err.name} ${err.message}` })
        );
};

// get franchisee by domain
const getByDomain = catchAsync(async (req, res, next) => {

    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    } console.log("client IP is *********************" + ip);

    // get domain
    const { domain } = req.params;
    let isValid = false;
    let franchisee = null;
    // let baseUrl = null;
    // let mediaUrl = null;
    let docByDomain = null;
    let docBySubDomain = null;

    docByDomain = await franchiseeModel.findOne({ domain: domain });
    const code = await DataFormater.generateUniqueNumber(8, true, true);

    if (!Validator.isEmptyObject(docByDomain)) {
        // baseUrl = `https://api.${docByDomain.domain}`;
        // mediaUrl = `https://content.${docByDomain.domain}`;
        isValid = true;
        franchisee = docByDomain._id;
    } else {
        docBySubDomain = await franchiseeModel.findOne({
            $or: [
                { generatedDomain: domain },
                { domainSlug: domain },
            ]
        });
        if (!Validator.isEmptyObject(docBySubDomain)) {
            isValid = true;
            franchisee = docBySubDomain._id;
        }
    }

    Promise.all([docByDomain, docBySubDomain]).then(() =>
        res.status(200).json({
            status: 'success',
            isValid,
            franchisee,
            // baseUrl,
            // mediaUrl,
            code
        })
    );
});

function lookup(domain) {
    return new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address, family) => {
            // if (err) {
            //     reject(err)
            // } else {
            resolve(address)
            // }
        })
    })
}

function records(domain) {
    return new Promise((resolve, reject) => {
        dns.resolveAny(domain, (err, records) => {
            // if (err) {
            //     reject(err)
            // } else {
            resolve(records)
            // }
        })
    })
}



module.exports = {
    registerFranchisee,
    getAllFranchisees,
    getFranchisee,
    updateFranchisee,
    getByDomain,
    createFranchisee,
    getFranchiseeByEmail,
    deleteFranchisee
};
