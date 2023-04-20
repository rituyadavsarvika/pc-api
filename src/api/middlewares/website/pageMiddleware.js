// Load utils
const AppError = require('../../../utils/error/appError');
const catchAsync = require('../../../utils/error/catchAsync');
const validator = require('./../../../utils/validator');
const DataFormate = require('./../../../utils/dataFormate');

// Load Model
const Page = require('./../../../models/website/pageModel');
const { checkSlugIsUnique } = require('../../../utils/helper');

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.pageId;
    validator
        .isValidId(Page.findOne({ _id: id }), id)
        .then(document => {
            req.builderId = document?.builderId;
            next();
        })
        .catch(err => next(new AppError('Invalid page id', 404)));
};

const generateSlug = catchAsync(async (req, res, next) => {
    const { pageName } = req.body;

    if (pageName) {
        const slug = await DataFormate.generateSlug(pageName);
        req.body.slug = slug;
    }

    next();
});

const setSlugField = catchAsync(async (req, res, next) => {
    const { slug, adminType, franchiseeId } = req.body;

    if (slug && adminType) {
        const { id } = req.params;
        const doc = await Page.findOne({
            adminType,
            franchiseeId,
            slug,
            _id: { $ne: id }
        });
        if (!validator.isEmptyObject(doc)) {
            const uId = await DataFormate.generateUniqueNumber(8, false, true);
            req.body.slug = `${slug}-${uId}`;
        }
    }
    next();
});

const setPageSlug = catchAsync(async (req, res, next) => {
    const { method } = req;
    const { pageName, pageType, franchiseeId, slug } = req.body;

    let generateSlugString = await DataFormate.generateSlug(slug || pageName);

    let condition = undefined;
    if (franchiseeId) {
        condition = {
            franchiseeId,
            pageType,
            slug: generateSlugString
        };
    } else {
        condition = {
            franchiseeId: null,
            pageType,
            slug: generateSlugString
        };
    }

    const uId = await DataFormate.generateUniqueNumber(8, true, true);
    // const page = await checkSlugIsUnique(condition)
    // console.log("page", page);

    if (method == 'POST') {
        const page = await checkSlugIsUnique(condition)
        console.log("page", page);
        if (!slug) {
            let generatedSlug = await DataFormate.generateSlug(pageName);
            condition['slug'] = generatedSlug;

            if (validator.isEmptyObject(page)) {
                req.body.slug = generatedSlug;
            }
            else {
                req.body.slug = `${generatedSlug}-${uId}`;
            }
        }
        else {
            let generatedSlug = await DataFormate.generateSlug(slug);
            if (slug == page[0]?.slug) {
                req.body.slug = `${generatedSlug}-${uId}`;
            }
            else {
                req.body.slug = generatedSlug
            }

        }
    }
    else if (method == 'PATCH') {
        const pageId = req.params.id;
        // condition['_id'] = pageId;
        // let generateSlugString = await DataFormate.generateSlug(slug || pageName);
        const page = await checkSlugIsUnique(condition)
        console.log("page", page);

        if(page.length > 0){

            condition['_id'] = pageId;
            const singlePage = await checkSlugIsUnique(condition)

            if(page.length == 1 && pageId == singlePage[0]?._id ){
                req.body.slug = `${generateSlugString}`;
            }
            else if(page.length > 1 && pageId == singlePage[0]?._id ){
                req.body.slug = `${generateSlugString}-${uId}`;
            }
            else{
                req.body.slug = `${generateSlugString}-${uId}`;
            }
        }
        else{
            req.body.slug = `${generateSlugString}`;
        }

        // if ( (slug == page[0]?.slug) && (franchiseeId == page[0]?.franchiseeId)) {
        //     req.body.slug = generateSlugString
        // }
        // else{
        //     if (!(page[0]?.franchiseeId)) {
        //         if ( slug == page[0]?.slug) {
        //             req.body.slug = `${generateSlugString}-${uId}`;
        //         }
        //         // else if (slug !== page[0]?.slug) {
        //         //     // let generatedSlug = generateSlugString
        //         //     req.body.slug = generateSlugString
        
        //         // }
        //         else {
        //             req.body.slug = generateSlugString
        //         }
        //     }
        //     else {
        //         if ((franchiseeId == page[0]?.franchiseeId) && (slug == page[0]?.slug)) {
        //             req.body.slug = `${generateSlugString}-${uId}`;
        //         }
        //         // else if ((franchiseeId !== page[0]?.franchiseeId) && (slug == page[0]?.slug)) {
        //         //     // let generatedSlug = generateSlugString
        //         //     req.body.slug = generateSlugString
        
        //         // }
        //         else {
        //             req.body.slug = generateSlugString
        //         }
    
        //     }

        // }

    }

    next();
});

module.exports = {
    checkValidId,
    generateSlug,
    setSlugField,
    setPageSlug
};
