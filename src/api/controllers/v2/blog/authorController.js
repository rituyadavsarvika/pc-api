const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');
const TourConfig = require('../../../../models/config/tourConfigModel');
const Author = require('../../../../models/franchisee/author/authorModel');

// get authors by subscriber Id
const getAuthors = catchAsync(async (req, res, next) => {
    const feature = new APIFeature(
        Author.find()
            .populate({
                path: 'authorImage',
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

    const authorList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Author.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([authorList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: authorList
        });
    });
});

// get authors by author Id
const getAuthorById = catchAsync(async (req, res, next) => {
    const { id } = req?.params
    const { adminType } = req?.query
    const { franchiseeId } = req?.user;
    
    let condition = {};
    if (adminType === 'SA') {
        condition = { _id: id, adminType };
    }
    else if (adminType === 'CA') {
        condition = { _id: id, adminType, franchiseeId };
    }

    const authorInfo = await Author
        .findOne(condition)
        .populate({
            path: 'authorImage',
            model: 'MediaContent',
            select: 'filePath altText'
        })
        .select('-__v')
        .lean()

    if (!authorInfo)
        return res.status(404).json({
            status: 'falied',
            message: 'Author not found',
            data: authorInfo
        });

    res.status(200).json({
        status: 'success',
        data: authorInfo
    })
});

// create authors
const createAuthor = catchAsync(async (req, res, next) => {
    const { franchiseeId } = req?.user

    if (!franchiseeId) {
        delete req.body.franchiseeId
        req.body.adminType = 'SA'
    }
    else {
        req.body.franchiseeId = req?.user?.franchiseeId
        req.body.adminType = 'CA'
    }

    const author = await Author.create(req.body);

    res.status(201).json({
        status: 'success',
        data: author
    });
});

// update author by author Id
const updateAuthor = catchAsync(async (req, res, next) => {
    const { id } = req?.params
    const { franchiseeId } = req?.user;
    const { name, authorEmail, socialLinks, authorImage, authorDetails, status, updatedBy, adminType } = req?.body
    
    let condition = {};
    if (adminType === 'SA') {
        condition = { _id: id, adminType };
    }
    else if (adminType === 'CA') {
        condition = { _id: id, adminType, franchiseeId };
    }

    const authorInfo = await Author
        .findOneAndUpdate(
            condition,
            {
                $set: {
                    name,
                    authorEmail,
                    socialLinks,
                    authorImage,
                    authorDetails,
                    status,
                    updatedBy,
                }
            },
            {
                // upsert: true,
                runValidators: true,
                returnDocument: 'after'
            }
        )
        .populate({
            path: 'authorImage',
            model: 'MediaContent',
            select: 'filePath altText'
        })

    if (!authorInfo)
        return res.status(400).json({ status: 'falied', data: authorInfo });

    res.status(202).json({
        status: 'success',
        data: authorInfo
    });
});

module.exports = {
    getAuthors,
    getAuthorById,
    createAuthor,
    updateAuthor,
};
