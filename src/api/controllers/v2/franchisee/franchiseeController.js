const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');
const config = require('./../../../../../config/keys');
const Validator = require('./../../../../utils/validator');
const FranchiseeModel = require('./../../../../models/franchisee/franchiseeModel');
const { domainExistanceHandler } = require('../../../../utils/helper');
const fsPromise = require('fs/promises');
const ip = require('ip');
const dns = require('dns');
const fs = require('fs');
const SubscriberConfig = require('../../../../models/config/subscriberConfigModel');
const { Types } = require('mongoose');
const User = require('../../../../models/auth/usersModel');

// get franchisee by domain
const getByDomain = catchAsync(async (req, res, next) => {
    // get domain
    const { domain } = req.params;
    let isValid = false;
    let franchisee = null;
    let subscriberDomain = null;
    let superAdminDomain = null;
    let isSubscriber = null;

    // superAdminDomain = await FranchiseeModel.findOne({
    //     $or: [
    //         { domain: domain },
    //         { generatedDomain: domain },
    //     ]
    // })
    // .lean();

    if (domain === config.FRONT_URL.HOST) {
        isValid = true;
        isSubscriber = false
        franchisee = null;
    }
    else {
        subscriberDomain = await FranchiseeModel.findOne({
            $or: [
                { domainSlug: domain },
                { domain: domain },
            ]
        })
            .lean();

        if (!Validator.isEmptyObject(subscriberDomain)) {
            isValid = true;
            franchisee = subscriberDomain._id;
            isSubscriber = true
        }
    }

    Promise.all([subscriberDomain, superAdminDomain]).then(() =>
        res.status(200).json({
            status: 'success',
            isValid,
            franchisee,
            isSubscriber,
            // subscriberDomain,
            // superAdminDomain,
        })
    );
});

/**
 * 1. add new custom domain: 
 *      - check duplicate domain from DB if match then return
 *      - check domain lookup if server IP match then update domain
 * 2. 
 */
const updateFranchisee = catchAsync(async (req, res) => {
    // domain https://www remove by REGEX: (http(s)?(:)?(\/\/)?|(\/\/)?(www\.)?(\/.+$))

    const { id } = req.params
    const { domainSlug, domainObject } = req.body

    const domainInitialFilter = req?.body?.domain?.replace(/http(s)?(:)?(\/\/)?|(\/\/)?(www\.)/g, '')
    const domain = domainInitialFilter.replace(/\/.*$/g, '');

    // console.log("domainInitialFilter:::", domainInitialFilter);
    // console.log("domain:::", domain);

    // return res.status(200).json({
    //     status: 'success',
    //     data: { domainInitialFilter, domain }
    // })

    const subscriberInfo = await FranchiseeModel.findOne({ _id: id });

    if (!domain || domain == '') {
        let domainHandler = domainObject

        if (subscriberInfo?.domain && !domain || domain == '' || domain == null) {
            fs.unlink(`${config.NGINX_CONFIG_URL}/${subscriberInfo?.domain}`, (err => {
                if (err){
                    console.log("file create err:::", err);
                    // domainHandler.status = 'Subscriber Domain remove failed',
                    // domainHandler.message = err
                }
                else {
                    console.log("\nDeleted...");
                    domainHandler.status = 'success',
                    domainHandler.message = 'Domain removed from source'
                }
            }));
            req.body['domain'] = ''
        }
        else {
            delete req.body['domain']
        }

        delete req.body['code'];
        // delete req.body['domain']

        try {
            const updatedFranchisee = await updateFranchiseeModel(id, req.body);

            res.status(200).json({
                status: 'success',
                data: { updatedFranchisee, domainHandler }
            })
        } catch (error) {
            res.status(500).json({
                status: 'failed',
                message: `${err.name} ${err.message}`
            })
        }



        // FranchiseeModel
        //     .findByIdAndUpdate(id, req.body, {
        //         new: true,
        //         runValidators: true
        //     })
        //     .populate({
        //         path: 'image',
        //         model: 'MediaContent',
        //         select: 'filePath altText'
        //     })
        //     .then(async updatedFranchisee => {
        //         // if (domain) {
        //         //     const domainHandler = await domainExistanceHandler(domain, domainSlug)

        //         //     return { updatedFranchisee, ...domainHandler }
        //         // }
        //         // else {
        //         return { updatedFranchisee };
        //         // }
        //     })
        //     .then((updatedFranchisee, domainCheckErr, lookupRes) => {
        //         res.status(200).json({
        //             status: 'success',
        //             data: { updatedFranchisee, domainCheckErr, lookupRes }
        //         });
        //     })
        //     .catch(err => {
        //         res.status(500).json({
        //             status: 'failed',
        //             message: `${err.name} ${err.message}`
        //         })
        //     });
    }
    else if (domain) {
        let domainHandler = {
            status: '',
            message: ''
        }
        const getSubscriberByDoamin = await FranchiseeModel.findOne({
            $and: [{ domain: { $ne: "" } }, { domain: { $eq: domain } }]
        })

        const lookupRes = await lookup(domain)
        console.log("lookupRes:::", lookupRes);
        console.log("Nginx Server Path:::", `${config.NGINX_CONFIG_URL}/${domain}`);

        fs.exists(`${config.NGINX_CONFIG_URL}/${domain}`, async (exist) => {
            console.log("FS exist:::", exist);
            if (exist == true && domain == getSubscriberByDoamin?.domain && id == getSubscriberByDoamin?._id) {
                //Exist
                delete req.body['domain']
                const updatedFranchisee = await updateFranchiseeModel(id, req.body);

                res.status(200).json({
                    status: 'success',
                    data: {
                        updatedFranchisee,
                        domainHandler: {
                            status: 'success',
                            message: 'Domain already exist in source'
                        }
                    }
                })
            }
            else if (exist == true && domain == getSubscriberByDoamin?.domain && id != getSubscriberByDoamin?._id) {
                //Exist
                delete req.body['domain']
                const updatedFranchisee = await updateFranchiseeModel(id, req.body);

                res.status(200).json({
                    status: 'success',
                    data: {
                        updatedFranchisee,
                        domainHandler: {
                            status: 'Subscriber Updated but Domain assign failed',
                            message: `${domain} already assigned`
                        }
                    }
                })
            }
            else if (exist == false) {
                // NO exist
                if (domain == getSubscriberByDoamin?.domain && id != getSubscriberByDoamin?._id) {
                    return res.status(409).json({
                        status: 'failed',
                        message: `${domain} already assigned`
                    })
                }
                else if (domain && lookupRes != ip.address()) {
                    return res.status(400).json({
                        status: 'failed',
                        message: `${domain} need to create two 'A Record according to ${ip.address()}' with the following information to make your domain active`
                    })
                }
                else if (domain && domain != subscriberInfo?.domain) {
                    if (lookupRes == ip.address()) {
                        fsPromise.unlink(`${config.NGINX_CONFIG_URL}/${subscriberInfo?.domain}`)
                        // new to save new ngnix file
                        domainHandler = await domainExistanceHandler(domain, domainSlug)

                        try {
                            const updatedFranchisee = await updateFranchiseeModel(id, req.body);

                            res.status(200).json({
                                status: 'success',
                                data: { updatedFranchisee, ...domainHandler }
                            })
                        } catch (error) {
                            res.status(500).json({
                                status: 'failed',
                                message: `${err.name} ${err.message}`
                            })
                        }
                    }
                }
                else if (domain && subscriberInfo?.domain == '') {
                    if (lookupRes == ip.address()) {
                        domainHandler = await domainExistanceHandler(domain, domainSlug)

                        try {
                            const updatedFranchisee = await updateFranchiseeModel(id, req.body);

                            res.status(200).json({
                                status: 'success',
                                data: { updatedFranchisee, ...domainHandler }
                            })
                        } catch (error) {
                            res.status(500).json({
                                status: 'failed',
                                message: `${err.name} ${err.message}`
                            })
                        }
                    }
                }
                else {
                    delete req.body['domain']
                    const updatedFranchisee = await updateFranchiseeModel(id, req.body);

                    res.status(200).json({
                        status: 'success',
                        data: { updatedFranchise, domainHandler }
                    })
                }
            }
            else {
                delete req.body['domain']
                const updatedFranchisee = await updateFranchiseeModel(id, req.body);

                res.status(200).json({
                    status: 'success',
                    data: { updatedFranchisee, domainHandler }
                })
            }
        })



    }

})

const updateFranchiseeModel = async (id, body) => {
    if (body?.domain) {
        SubscriberConfig.updateOne(
            { franchiseeId: Types.ObjectId(id) },
            {
                $set: {
                    'customDomain.domain': body.domain,
                    'customDomain.isServerConfigCreated': true,
                    'customDomain.isARecordCreated': true,
                    'customDomain.isSslActive': true,
                    'customDomain.sslExpireAt': null,
                    'customDomain.updatedBy': body?.updatedBy,
                }
            }
        ).then(result => { console.log("updatedSubscriberConfig:::", result); });
    }
    else {
        SubscriberConfig.updateOne(
            { franchiseeId: Types.ObjectId(id) },
            {
                $set: {
                    'customDomain.domain': '',
                    'customDomain.isServerConfigCreated': false,
                    'customDomain.isARecordCreated': false,
                    'customDomain.isSslActive': false,
                    'customDomain.sslExpireAt': null,
                    'customDomain.updatedBy': body?.updatedBy,
                }
            }
        ).then(result => { console.log("updatedSubscriberConfig:::", result); });
    }

    if (body?.name) {
        // console.log("body?.name:::", body?.name);
        const splitName = body?.name?.split(' ')
        const firstName = splitName && splitName[0]

        let lastName = ''
        splitName && splitName?.filter((item, index) => {
            if (item !== splitName[0]) {
                lastName = `${lastName.concat(splitName[index])} `
            }
        })

        // console.log("body?.firstName:::", firstName);
        // console.log("body?.lastName:::", lastName);

        User.updateOne(
            { franchiseeId: Types.ObjectId(id) },
            {
                $set: {
                    firstName,
                    lastName
                }
            }
        ).then(result => { console.log("updateUser:::", result); });
    }

    return await FranchiseeModel
        .findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true
        })
        .populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        })

}

// domain lookup for IP address
const lookup = (domain) => {
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


module.exports = {
    getByDomain,
    updateFranchisee
};
