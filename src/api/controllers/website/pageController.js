// Load utils
const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// Load Model
const Page = require('./../../../models/website/pageModel');
const PageBuilder = require('./../../../models/website/pageBuilderModel');
const Header = require('../../../models/website/headerModel');
const Footer = require('./../../../models/website/footerModel');
const Validator = require('./../../../utils/validator');
const Menu = require('./../../../models/website/menuModel');

// create new page
const createPage = catchAsync(async (req, res) => {
    // remove isHomePage form body object
    delete req.body['isHomePage'];

    // console.log("Page create req.body:::", req.body);

    const newPage = await Page.create(req.body);

    res.status(201).json({
        status: 'success',
        data: newPage
    });
});

// get all page with query parameter to get filter data
const getAllPage = catchAsync(async (req, res) => {
    // console.log('yes!!!!!!!!!!!!!!!')

    const feature = new APIFeature(
        Page.find()
            .populate({
                path: 'builderId',
                model: 'PageBuilder',
                select: 'name content'
            })
            .populate({
                path: 'createdBy updatedBy',
                select: 'email firstName'
            })
            .populate('meta.image'),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const pageList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Page.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([pageList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: pageList
        });
    });
});

// get all page meta data with query parameter to get filter data
const getAllMetaData = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        Page.find().populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const pageList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Page.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    let jsonData = JSON.parse(JSON.stringify(pageList[0]))
    delete jsonData.builderId;
    delete jsonData.renderType;
    delete jsonData.createdAt;
    delete jsonData.updatedAt;
    delete jsonData.franchiseeId;
    delete jsonData.isHomePage;

    Promise.all([jsonData, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            data: jsonData
        });
    });
});

// get a specific page by page Id
const getPage = catchAsync(async (req, res) => {
    console.log('api calling..............')

    const page = await Page.findOne(
        { _id: req.params.id },
        {
            pageName: 1,
            pageTitle: 1,
            slug: 1,
            adminType: 1,
            meta: 1,
            renderType: 1,
            isHomePage: 1,
            franchiseeId: 1
        }
    )
        .populate({
            path: 'classicId',
            model: 'ClassicPage',
            select: 'brandLogo pageHeader pageFeature pageAbout pageSlider pageContent pageContact'
        })
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .populate({
            path: 'meta.image',
            model: 'MediaContent',
            select: 'filePath altText'
        });

    res.status(200).json({
        status: 'success',
        data: page
    });
});

// update specific page by Id
const updatePage = catchAsync(async (req, res) => {
    // remove isHomePage form body object
    delete req.body['isHomePage'];
    const { adminType, franchiseeId, slug, initialSlug } = req.body

    // update menu slug after update page slug
    let menuObj = await Menu.findOne({
        adminType: adminType,
        franchiseeId: franchiseeId,
        $text: { $search: `\"${initialSlug}\"` }
    });

    let filteredObj = {}
    let updatedMenu = {}

    if ( menuObj ){
        filteredObj = Object.entries(menuObj?.content[0]?.items).filter((item, index) => {
            console.log("slug == initialSlug:::", menuObj?.content[0]?.items[item[0]]?.data?.slug == initialSlug);
    
            if(menuObj?.content[0]?.items[item[0]]?.data?.slug == initialSlug) {
                menuObj.content[0].items[item[0]].data.slug = slug
                return menuObj
            }
        })

        delete menuObj.createdAt
        delete menuObj.updatedAt

        updatedMenu = await Menu.findByIdAndUpdate( menuObj?._id, menuObj, {
            new: true,
            runValidators: true
        });
    }

    const pageInfo = await Page.findById(req.params.id).lean()

    if(pageInfo?.isHomePage){
        req.body.status = 'publish'
    }

    const updatedPage = await Page.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ status: 'Success', data: updatedPage, filteredObj, menuObj, updatedMenu});
});

/**
 * @param {req} request objects
 * @param {res} response objects
 * @description controller to delete Page
 */
const deletePage = (req, res) => {
    Page.deleteOne({ _id: req.params.id })
        .then(pageDoc => {
            if (pageDoc.deletedCount === 0)
                throw new Error('Delete unsuccessful');
            else return PageBuilder.deleteOne({ _id: req.builderId });
        })
        .then(() =>
            res.status(200).json({
                status: 'success',
                message: 'Successfully Deleted'
            })
        )
        .catch(err => {
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

// get Super admin landing page
const getSuperAdminLandingPage = catchAsync(async (req, res) => {
    console.log('api calling by super admin !!!!!!!!!!!!!')

    // Page Section
    const page = await Page.findOne({
        adminType: 'SA',
        isHomePage: true
    })
        .populate('meta.image')
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .select('pageName pageTitle slug meta renderType classicId builderId');

    res.status(200).json({
        status: 'success',
        data: {
            page
        }
    });
});

// get Super admin landing page new
const getSuperAdminLandingPageNew = catchAsync(async (req, res) => {
    console.log('api calling by super admin !!!!!!!!!!!!!')
    let headerData, footerData;

    // Page Section
    const page = await Page.findOne({
        adminType: 'SA',
        isHomePage: true
    })
        .populate('meta.image')
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .select('pageName pageTitle slug meta renderType classicId builderId');


    const adminType = 'SA';
    let condition = {};
    let headerCondition = {};
    if (adminType === 'SA') {
        condition = { adminType, active: true };
        headerCondition = { adminType, headerMenu: true };
    } else {
        condition = { adminType, franchiseeId, active: true };
        headerCondition = { adminType, franchiseeId, headerMenu: true };
    }

    const designHeader = await Header.findOne(condition);
    if (Validator.isEmptyObject(designHeader)) {
        const headerMenu = await Menu.findOne(headerCondition);
        if (Validator.isEmptyObject(headerMenu)) {
            headerData = {
                status: 'success',
                design: 'default',
                data: null
            }
        } else {
            headerData = {
                _id: headerMenu._id,
                name: headerMenu.name,
                content: headerMenu.content
            }
        }
    } else {
        headerData = {
            _id: designHeader._id,
            name: designHeader.name,
            content: designHeader.content
        }
    }

    let footerCondition = {};
    if (adminType === 'SA') {
        condition = { adminType, active: true };
        footerCondition = { adminType, footerMenu: true };
    } else {
        condition = { adminType, franchiseeId, active: true };
        footerCondition = { adminType, franchiseeId, footerMenu: true };
    }

    const designFooter = await Footer.findOne(condition);
    if (Validator.isEmptyObject(designFooter)) {
        const footerMenu = await Menu.findOne(footerCondition);
        if (Validator.isEmptyObject(footerMenu)) {
            footerData = {
                status: 'success',
                design: 'default',
                data: null
            }
        } else {
            footerData = {
                _id: footerMenu._id,
                name: footerMenu.name,
                content: footerMenu.content
            }
        }
    } else {
        footerData = {
            _id: designFooter._id,
            name: designFooter.name,
            content: designFooter.content
        }

    }


    res.status(200).json({
        status: 'success',
        data: {
            page,
            headerData,
            footerData
        }
    });
});

// get Super admin landing page MetaData
const getSuperAdminLandingPageMetaData = catchAsync(async (req, res) => {
    console.log('..................api calling by super admin !!!!!!!!!!!!!')

    // Page Section
    const page = await Page.findOne({
        adminType: 'SA',
        isHomePage: true
    })
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .populate('meta.image')
        .select('pageName pageTitle slug meta renderType classicId builderId');

    let jsonData = JSON.parse(JSON.stringify(page));
    delete jsonData.builderId;
    delete jsonData.renderType;

    res.status(200).json({
        status: 'success',
        data: {
            page: jsonData
        }
    });
});

// get city admin landing page
const getCityAdminLandingPage = catchAsync(async (req, res) => {
    console.log('api calling by city admin !!!')
    const franchiseeId = req.params.franchiseeId;

    // Page Section
    const page = await Page.findOne({
        adminType: 'CA',
        isHomePage: true,
        franchiseeId
    })
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .populate('meta.image')
        .select('pageName pageTitle slug meta renderType classicId builderId');

    res.status(200).json({
        status: 'success',
        data: {
            page
        }
    });
});


// get city admin landing page
const getCityAdminLandingPageNew = catchAsync(async (req, res) => {
    let headerData, footerData;
    console.log('api calling by city admin !!!')
    const franchiseeId = req.params.franchiseeId;

    // Page Section
    const page = await Page.findOne({
        adminType: 'CA',
        isHomePage: true,
        franchiseeId
    })
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .populate('meta.image')
        .select('pageName pageTitle slug meta renderType classicId builderId');

    const adminType = 'CA';
    let condition = {};
    let headerCondition = {};
    if (adminType === 'SA') {
        condition = { adminType, active: true };
        headerCondition = { adminType, headerMenu: true };
    } else {
        condition = { adminType, franchiseeId, active: true };
        headerCondition = { adminType, franchiseeId, headerMenu: true };
    }

    const designHeader = await Header.findOne(condition);
    if (Validator.isEmptyObject(designHeader)) {
        const headerMenu = await Menu.findOne(headerCondition);
        if (Validator.isEmptyObject(headerMenu)) {
            headerData = {
                status: 'success',
                design: 'default',
                data: null
            }
        } else {
            headerData = {
                _id: headerMenu._id,
                name: headerMenu.name,
                content: headerMenu.content
            }
        }
    } else {
        headerData = {
            _id: designHeader._id,
            name: designHeader.name,
            content: designHeader.content
        }
    }

    let footerCondition = {};
    if (adminType === 'SA') {
        condition = { adminType, active: true };
        footerCondition = { adminType, footerMenu: true };
    } else {
        condition = { adminType, franchiseeId, active: true };
        footerCondition = { adminType, franchiseeId, footerMenu: true };
    }

    const designFooter = await Footer.findOne(condition);
    if (Validator.isEmptyObject(designFooter)) {
        const footerMenu = await Menu.findOne(footerCondition);
        if (Validator.isEmptyObject(footerMenu)) {
            footerData = {
                status: 'success',
                design: 'default',
                data: null
            }
        } else {
            footerData = {
                _id: footerMenu._id,
                name: footerMenu.name,
                content: footerMenu.content
            }
        }
    } else {
        footerData = {
            _id: designFooter._id,
            name: designFooter.name,
            content: designFooter.content
        }

    }

    res.status(200).json({
        status: 'success',
        data: {
            page,
            headerData,
            footerData
        }
    });
});

// get city admin landing page MetaData
const getCityAdminLandingPageMetaData = catchAsync(async (req, res) => {
    console.log('api calling by city admin !!!')
    const franchiseeId = req.params.franchiseeId;

    // Page Section
    const page = await Page.findOne({
        adminType: 'CA',
        isHomePage: true,
        franchiseeId
    })
        .populate({
            path: 'builderId',
            model: 'PageBuilder',
            select: 'name content'
        })
        .populate('meta.image')
        .select('pageName pageTitle slug meta renderType classicId builderId');

    let jsonData = JSON.parse(JSON.stringify(page));
    delete jsonData.builderId;
    delete jsonData.renderType;

    res.status(200).json({
        status: 'success',
        data: {
            page: jsonData
        }
    });
});

const makeHomePage = (req, res) => {
    const { pageId } = req.params;
    const { adminType, franchiseeId } = req.body;

    Page.updateMany(
        { adminType, franchiseeId },
        { $set: { isHomePage: false } }
    )
        .then(() => {
            return Page.findByIdAndUpdate(
                pageId,
                { $set: { isHomePage: true, status: 'publish' } },
                {
                    new: true,
                    runValidators: true
                }
            );
        })
        .then(homePage =>
            res.status(200).json({
                status: 'success',
                message: `"${homePage.pageName}" is marked as home page`
            })
        )
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            })
        );
};

module.exports = {
    createPage,
    getAllPage,
    getAllMetaData,
    getPage,
    updatePage,
    deletePage,
    getSuperAdminLandingPage,
    getSuperAdminLandingPageMetaData,
    getCityAdminLandingPage,
    getCityAdminLandingPageMetaData,
    makeHomePage,
    getCityAdminLandingPageNew, getSuperAdminLandingPageNew
};
