const moment = require('moment');

// Load utils
const catchAsync = require('./../src/utils/error/catchAsync');

// Load Model
const Blog = require('./../src/models/website/blogModel');

const makePublish = catchAsync(async () => {
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
});

module.exports = { makePublish };
