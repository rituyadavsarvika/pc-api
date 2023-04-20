const moment = require('moment');

// Load utils
const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// Load Model
const Blog = require('./../../../models/website/blogModel');
const Menu = require('../../../models/website/menuModel');

// Controller to create blog post
const createPost = catchAsync(async (req, res) => {
    let blog = await Blog.create(req.body);
    blog = await blog
        .populate({
            path: 'tags',
            model: 'Tag',
            select: 'name slug label value'
        })
        .populate({
            path: 'authorId',
            model: 'Author',
            select: 'name authorEmail label value'
        })
        .populate([{
            path: 'secondaryAuthorIds',
            model: 'Author',
            select: 'name authorEmail label value'
        }])
        .populate({
            path: 'featureImageUrl',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        .populate({
            path: 'createdBy updatedBy',
            select: 'email firstName'
        })
        .execPopulate()

    res.status(201).json({
        status: 'success',
        data: blog
    });
});

// controller to get all blog posts with or without franchiseeId and dynamically filtered
const getAllPost = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        Blog.find()
            .populate({
                path: 'tags',
                model: 'Tag',
                select: 'name slug label value'
            })
            .populate({
                path: 'authorId',
                model: 'Author',
                select: 'name authorEmail label value socialLinks authorImage',
                populate: {
                    path: 'authorImage',
                    model: 'MediaContent',
                    select: 'filePath altText'
                }
            })
            .populate([{
                path: 'secondaryAuthorIds',
                model: 'Author',
                select: 'name authorEmail label value socialLinks authorImage',
                populate: {
                    path: 'authorImage',
                    model: 'MediaContent',
                    select: 'filePath altText'
                }
            }])
            .populate({
                path: 'featureImageUrl',
                model: 'MediaContent',
                select: 'filePath altText'
            })
            .populate({
                path: 'createdBy updatedBy',
                select: 'email firstName'
            }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const blogList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Blog.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([blogList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: blogList
        });
    });
});

// get a single post by post id
const getPost = catchAsync(async (req, res) => {
    const post = await Blog.findOne({ _id: req.params.id, franchiseeId: req.query.franchiseeId })
        .populate({
            path: 'tags',
            model: 'Tag',
            select: '_id name'
        })
        .populate({
            path: 'authorId',
            model: 'Author',
            select: 'name authorEmail label value'
        })
        .populate([{
            path: 'secondaryAuthorIds',
            model: 'Author',
            select: 'name authorEmail label value'
        }])
        .populate({
            path: 'featureImageUrl',
            model: 'MediaContent',
            select: 'filePath altText'
        });

    res.status(200).json({
        status: 'success',
        data: post
    });
});

// Update blog post by id
const updatePost = catchAsync(async (req, res) => {
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

    const updatedPost = await Blog.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
            returnDocument: 'after'
        })
        .populate({
            path: 'featureImageUrl',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        .populate({
            path: 'authorId',
            model: 'Author',
            select: 'name authorEmail label value'
        })
        .populate([{
            path: 'secondaryAuthorIds',
            model: 'Author',
            select: 'name authorEmail label value'
        }])

    res.status(200).json({ status: 'Success', data: updatedPost });
});

const deletePost = catchAsync(async (req, res) => {
    await Blog.deleteOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

const makePublish = catchAsync(async (req, res) => {
    const currentTime = moment().utc().format();

    // Update posts
    await Blog.updateMany(
        {
            publish: false,
            publishedAt: {
                $lte: currentTime
            }
        },
        {
            $unset: { publishedAt: 1 },
            $set: { publish: true }
        }
    );

    res.status(200).json({
        status: 'success',
        message: 'Post published successfully'
    });
});

module.exports = {
    createPost,
    getAllPost,
    getPost,
    updatePost,
    deletePost,
    makePublish,

};
