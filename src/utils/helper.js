const fs = require('fs');
const dns = require('dns');
const keys = require('../../config/keys');
const mongoose = require('mongoose');
const Blog = require('../models/website/blogModel');
var ip = require('ip');


const lookup = (domain) => {
    return new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address, family) => {
            resolve(address)
        })
    })
}

const records = (domain) => {
    return new Promise((resolve, reject) => {
        dns.resolveAny(domain, (err, addresses) => {
            // console.log("records:::", addresses);
            resolve(addresses)
        })
    })
}

const domainExistanceHandler = async (domain, domainSlug) => {
    let domainCheckErr = {
        address: '',
        records: '',
        domainInfo: ''
    }

    console.log('================================================')
    console.log('Domain:::', domain)

    console.log('Domain lookup start:::')
    let lookupRes = await lookup(domain)
    console.log('Domain lookup End:::', lookupRes)


    console.log('lookupRes:::', lookupRes)

    if (lookupRes) {
        console.log('=== Lookup IF')
    }
    else {
        console.log('=== Lookup ELSE')
        domainCheckErr.address = lookupRes
        domainCheckErr.domainInfo = "Address not found"
    }

    try {
        if (lookupRes) {
            domainCheckErr.domainInfo = "Domain Exist but Hosting not found"

            const configFile = `${domain}`;
            const configDir = `${keys.NGINX_CONFIG_URL}/${configFile}`;

            console.log("fconfigDir:::", configDir);
            console.log("fs.existsSync(configDir):::", fs.existsSync(configDir));

            try {

                if (lookupRes == ip.address()) {
                    // generating SSL using lets encrypt
                    if (!fs.existsSync(configDir)) {
                        // load config template
                        const configContentPath =
                            __dirname +
                            '/templates/serverConfigNew.conf';

                        let configContent = fs.readFileSync(configContentPath, {
                            encoding: 'utf8'
                        });

                        configContent = configContent.replace(/\$domain/g, domain);

                        // console.log("configContent:::", configContent);
                        fs.writeFileSync(configDir, configContent, async function (err) {
                            if (err) {
                                console.log("fs.writeFile Error:::", err);
                            }

                            configContent = configContent.replace(/\$domain/g, domain);

                            console.log("configContent:::", configContent);
                            fs.writeFile(configDir, configContent, async function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        })
                    }
                }
                else {
                    console.log('Yes');
                    domainCheckErr.domainInfo = "domain add faield"

                    return { domainCheckErr, lookupRes };
                };
            } catch (error) {
                console.log("error 1:::", error);
                return { domainCheckErr, lookupRes };
            }
        }
        else if (!lookupRes) {
            domainCheckErr.domainInfo = "Domain & Hosting Exist"
            return { domainCheckErr, lookupRes };
        }

        return { domainCheckErr, lookupRes };

    } catch (error) {
        console.log("error 2:::", error);
        return { domainCheckErr, lookupRes };
    }
}


const checkSlugIsUnique = async data => {
    let { pageName, pageType, franchiseeId, slug, _id } = data

    let condition = undefined;
    if (franchiseeId) {
        condition = {
            franchiseeId: mongoose.Types.ObjectId(franchiseeId),
            slug,
            _id: mongoose.Types.ObjectId(_id)
            // pageType,
            // pageName
        };
    } else {
        condition = {
            franchiseeId: null,
            slug,
            _id: mongoose.Types.ObjectId(_id)
            // pageType,
            // pageName
        };
    }

    if (!_id) delete condition._id
    console.log("condition", condition);

    let getPageContent = await Blog.aggregate([
        {
            $match: condition
        },
        {
            $unionWith: {
                coll: 'products',
                pipeline: [
                    {
                        $match: condition
                    }
                ]
            },

        },
        {
            $unionWith: {
                coll: 'pages',
                pipeline: [
                    {
                        $match: condition
                    }
                ]
            },

        },
        {
            $project: {
                slug: 1,
                franchiseeId: 1
            }
        }
    ])

    return getPageContent

}

// const formatBytes = (bytes, decimals = 2) => {
//     if (!+bytes) return '0 Bytes'

//     const k = 1024
//     const dm = decimals < 0 ? 0 : decimals
//     // const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
//     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

//     const i = Math.floor(Math.log(bytes) / Math.log(k))

//     return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
// }

const formatBytes = (bytes = 0, decimals = 6) => {
    const gbValue = (bytes / (1024 * 1024 * 1024)).toFixed(decimals) || 0;

    return `${gbValue}`
}

module.exports = {
    domainExistanceHandler,
    checkSlugIsUnique,
    formatBytes
}