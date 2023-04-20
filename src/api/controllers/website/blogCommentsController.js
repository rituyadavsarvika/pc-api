const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// Load model
const BlogComment = require('./../../../models/website/blogCommentsModel');

// create New Comment
const createComment = catchAsync(async (req, res) => {
    let { postId, authorName, authorEmail, commentAt, message } = req.body;

    // formate data
    authorEmail = authorEmail ? authorEmail : undefined;
    authorName = authorName ? authorName : undefined;
    const postSlug = req.postSlug;

    const newComment = await BlogComment.create({
        postId,
        postSlug,
        authorName,
        authorEmail,
        commentAt,
        message,
        reply: []
    });

    res.status(201).json({
        status: 'success',
        data: newComment
    });
});

// get all blog comments
const getAllComment = catchAsync(async (req, res) => {
    const feature = new APIFeature(BlogComment.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const commentList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        BlogComment.countDocuments(),
        req.query
    ).countFilter();

    const docCount = await cQuery.query;

    Promise.all([commentList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: commentList
        });
    });
});
const getComment = catchAsync(async (req, res) => {});
const getCommentByPost = catchAsync(async (req, res) => {});

module.exports = { createComment, getAllComment, getComment, getCommentByPost };
