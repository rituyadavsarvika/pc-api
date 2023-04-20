const AppError = require('./../../../utils/error/appError');
const validator = require('./../../../utils/validator');
const catchAsync = require('./../../../utils/error/catchAsync');
const DataFormate = require('./../../../utils/dataFormate');

// Load model
const Blog = require('./../../../models/website/blogModel');
const { checkSlugIsUnique } = require('../../../utils/helper');

const checkValidId = (req, res, next) => {
    const id = req.params.id || req.body.postId;
    validator
        .isValidId(Blog.findOne({ _id: id }), id)
        .then(() => next())
        .catch(err => next(new AppError(err, 404)));
};

/**
 * @param  {request} req
 * @param  {response} res
 * @param  {} next
 * @description handle publish field in update API request
 */
const validateSchedule = (req, res, next) => {
    const { schedule } = req.body;

    if (schedule && schedule.toLowerCase() === 'now') {
        req.body.publish = true;
        req.body['publishedAt'] = undefined;
    } else if (schedule && schedule.toLowerCase() === 'custom') {
        req.body.publish = false;
    } else {
        delete req.body['publish'];
        delete req.body['publishedAt'];
    }

    next();
};

// middleware to generate slug with name
const generateSlug = catchAsync(async (req, res, next) => {
    const { title } = req.body;

    if (title) {
        const slug = await DataFormate.generateSlug(title);
        req.body.slug = slug;
    }

    next();
});

// check if slug already exist or not. if exist then add a 8 digit number as a suffix
const setSlugField = catchAsync(async (req, res, next) => {
    const { slug, adminType, franchiseeId } = req.body;

    if ((slug, adminType)) {
        const { id } = req.params;
        const doc = await Blog.findOne({
            adminType,
            franchiseeId,
            slug,
            _id: { $ne: id }
        });
        if (!validator.isEmptyObject(doc)) {
            const uId = await DataFormate.generateUniqueNumber(2, false, true);
            req.body.slug = `${slug}-${uId}`;
        }
    }

    next();
});

// middleware function to get existing image
const getExistingImage = catchAsync(async (req, res, next) => {
    const postId = req.params.id;
    const featureImageUrl = req.body.featureImageUrl;
    const doc = await Blog.findOne({ _id: postId });
    if (!featureImageUrl || doc.featureImageUrl) {
        req.body.featureImageUrl = doc.featureImageUrl;
    }
    next();
});

// middleware to generate query to handle multiple tags
const generateTagListQuery = (req, res, next) => {
    let tagList = req.params.tagList;
    tagList = JSON.parse(tagList);

    req.query['tags'] = { $in: tagList };
    next();
};

// Middleware to generate query to handle multiple posts
const generatePostListQuery = (req, res, next) => {
    let postList = req.params.postList;
    postList = JSON.parse(postList);

    req.query['_id'] = { $in: postList };
    next();
};

// check if slug already exist or not. if exist then add a 8 digit number as a suffix
const setPageSlug = catchAsync(async (req, res, next) => {
    const { method } = req;
    const { slug, adminType, franchiseeId } = req.body;
    const { title, pageType } = req.body;

    let generateSlugString = await DataFormate.generateSlug(slug || title);

    console.log("req.params", req.params);
    console.log("req.headers", req.headers);
    console.log("req.body", req.body);

    let condition = undefined;
    if (franchiseeId) {
        condition = {
            franchiseeId,
            slug: generateSlugString
        };
    } else {
        condition = {
            franchiseeId: null,
            slug: generateSlugString
        };
    }

    const uId = await DataFormate.generateUniqueNumber(8, true, true);

    if (method == 'POST') {
        const page = await checkSlugIsUnique(condition)
        console.log("page", page);
        if (!slug) {
            let generatedSlug = await DataFormate.generateSlug(title);
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
    }


    next();
});

module.exports = {
    checkValidId,
    validateSchedule,
    generateSlug,
    setSlugField,
    getExistingImage,
    generateTagListQuery,
    generatePostListQuery,
    setPageSlug
};
