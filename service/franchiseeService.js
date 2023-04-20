const fs = require('fs');

// Load Utils
const DataFormater = require('./../src/utils/dataFormate');

// Load utils
const catchAsync = require('./../src/utils/error/catchAsync');

// load model
const PageBuilder = require('../src/models/website/pageBuilderModel');
const Page = require('../src/models/website/pageModel');
const FranchiseeModel = require('../src/models/franchisee/franchiseeModel');
// const Globalsettings = require('../src/models/website/global/globalSettings.model');

const createPageBuilder = (franchiseeId, name) => {
    const filePath = __dirname + '/../src/utils/templates/defaultBuilder.json';

    return new Promise((resolve, reject) => {
        let data = fs.readFileSync(filePath, { encoding: 'utf8' });
        data = data.replace(/shop_name/g, name);

        PageBuilder.create({
            name: 'Home page',
            adminType: 'CA',
            franchiseeId: franchiseeId,
            content: JSON.parse(data)
        })
            .then(doc => resolve(doc))
            .catch(err => reject(err));
    });
};

const createHomePage = (name, franchiseeId) => {
    return new Promise(
        catchAsync(async (resolve, reject) => {
            const pageName = `Home page of ${name}`;
            const newPageBuilder = await createPageBuilder(franchiseeId, name);
            const doc = await Page.create({
                pageName,
                pageTitle: `${name}`,
                slug: await DataFormater.generateSlug(pageName),
                adminType: 'CA',
                franchiseeId,
                renderType: 'builder',
                builderId: newPageBuilder._id,
                isHomePage: true
            });
            resolve(doc);
        })
    );
};

// const createGlobalSetting = (name, franchiseeId) => {
//     return new Promise(
//         catchAsync(async (resolve, reject) => {
//             const newHomePage = await createHomePage(
//                 name,
//                 franchiseeId
//             );
//             const doc = await Globalsettings.create({
//                 adminType: 'CA',
//                 franchiseeId,
//                 title: name,
//                 brand: name,
//                 showBlog: false,
//                 showShop: false,
//                 logo: null,
//                 favicon: null,
//                 theme: {
//                     color: {
//                         primary: '#916BBF',
//                         secondary: '#C996CC',
//                         accent: '#1C0C5B'
//                     }
//                 },
//                 homePageId: newHomePage._id
//             });
//             resolve(doc);
//         })
//     );
// };

const checkDomainIsExist = async (req, res) => {
    let franchiseeList = await FranchiseeModel
        .find({ $and: [{ domain: { $ne: null } }, { domain: { $ne: '' } }] })
        .select('domain')
        // .exec()

        return franchiseeList
}

module.exports = {
    createHomePage,
    checkDomainIsExist
};
