// const fs = require('fs');
const fsPromise = require('fs/promises');

const config = require('./../../../../config/keys');
const LOGGER = require('./../../../../config/logger');

// Load Utils
const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');
const dataFormater = require('./../../../utils/dataFormate');

// Load Model
const MediaContent = require('./../../../models/media/mediaContentModel');
const SubscriberConfig = require('./../../../models/config/subscriberConfigModel');

// upload new media file
const uploadNew = catchAsync(async (req, res) => {
    const { franchiseeId, adminType } = req.body;
    // get file variable
    const file = req.file;

    console.log("franchiseeId, adminType:::", franchiseeId, adminType);
    console.log("file:::", file);

    fsPromise
        .copyFile(file.path, `${config.MEDIA_ROOT}/${req.body?.filePath}`)
        .then(() => MediaContent.create(req.body))
        .then(newContent => {
            console.log("newContent:::", newContent);
            let condition = {};
            if (adminType === 'CA')
                condition = { adminType: 'CA', franchiseeId };
            else condition = { adminType: 'SA' };

            const increaseStorage = SubscriberConfig.updateOne(condition, {
                $inc: { spaceUsages: parseInt(newContent?.size) }
            });

            return Promise.all([newContent, increaseStorage]);
        })
        .then(([newContent, increaseStorage]) => {

            console.log("newContent, increaseStorage:::", newContent, increaseStorage);
            LOGGER.info(
                `FIle with name '${file?.fileName}' mediaType '${file?.mediaType}' extension '${file?.extension}' upload done`
            );
            res.status(200).json({
                status: 'success',
                data: newContent
            });
        })
        .catch(err => {
            LOGGER.error(`${err?.type} ${err?.raw?.message}`);
            console.log("err:::", err);
            res.status(500).json({
                status: 'fail',
                message: `${err?.type} ${err?.raw?.message}`
            });
        });
});

// get all media content
const getAllContent = catchAsync(async (req, res) => {
    const feature = new APIFeature(MediaContent.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const contentList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        MediaContent.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([contentList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: contentList
        });
    });
});

const searchMedia = catchAsync(async (req, res) => {
    let { adminType, searchBy, mediaType } = req.params;
    mediaType = JSON.parse(mediaType);

    let filterQuery = {
        mediaType: { $in: mediaType },
        adminType
    };

    if (searchBy) {
        filterQuery['$text'] = {
            $search: searchBy
        };
    }

    const feature = new APIFeature(MediaContent.find(filterQuery), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const mediaList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        MediaContent.countDocuments(filterQuery),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([mediaList, docCount]).then(() =>
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: mediaList
        })
    );
});

// get a media content details by id
const getContent = catchAsync(async (req, res) => {
    const content = await MediaContent.findOne({
        _id: req.params.id
    });

    res.status(200).json({
        status: 'success',
        data: content
    });
});

// get a media content details by id
const updateContent = catchAsync(async (req, res) => {
    let { fileName, altText, caption, description } = req.body;
    const contentId = req.params.id;

    // generate Slug
    slug = await dataFormater.generateSlug(fileName);

    const updatedContent = await MediaContent.findByIdAndUpdate(
        contentId,
        {
            fileName: slug,
            altText: altText || '',
            caption: caption || '',
            description: description || ''
        },
        {
            new: true,
            runValidators: true
        }
    );

    Promise.all([slug, updatedContent])
        .then(() => {
            LOGGER.info(`Media content updated done for id ${contentId}`);
            res.status(200).json({
                status: 'success',
                data: updatedContent
            });
        })
        .catch(err => {
            LOGGER.error(
                `Media content update failed for id ${contentId}. The error is ${err}`
            );
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err.message}`
            });
        });
});

const deleteContent = (req, res) => {
    const { filePath, size, adminType, franchiseeId } = req;
    const contentId = req.params.id;
    // delete doc from db
    MediaContent.deleteOne({ _id: contentId })
        .then(media => {
            if (media.deletedCount === 0)
                throw new Error('Delete unsuccessful');
            else return fsPromise.unlink(`${config.MEDIA_ROOT}/${filePath}`);
        })
        .then(() => {
            let condition = {};
            if (adminType === 'CA')
                condition = { adminType: 'CA', franchiseeId };
            else condition = { adminType: 'SA' };

            return SubscriberConfig.updateOne(condition, {
                $inc: { spaceUsages: -size }
            });
        })
        .then(updatedConfig => {
            LOGGER.info(`Media content delete done with id ${contentId}`);
            res.status(200).json({
                status: 'success',
                message: 'Media Content deleted successfully'
            });
        })
        .catch(err => {
            LOGGER.info(
                `Media content delete unsuccessful with id ${contentId}. The error is ${err}`
            );
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

const updatePath = catchAsync(async (req, res) => {
    const { adminType, franchiseeId } = req.body;
    const domainSlug = req.domainSlug;
    const code = req.code;
    let condition = {};

    if (adminType === 'SA') condition = { adminType: 'SA' };
    else condition = { adminType: 'CA', franchiseeId };

    await MediaContent.updateMany(condition, [
        {
            $set: {
                filePath: {
                    $replaceOne: {
                        input: '$filePath',
                        find: domainSlug,
                        replacement: code
                    }
                }
            }
        }
    ]);

    res.status(200).json({ franchiseeId, code, domainSlug });
});

// controller to increment use count
const incrementUseCount = catchAsync(async (req, res) => {
    const idList = req.body.mediaId;

    if (idList.length < 1) {
        LOGGER.info(`No media found to increased useCount`);
        res.status(200).json({
            status: 'success',
            message: 'No media found'
        });
    } else {
        await Promise.all(
            idList.map(async mediaId => {
                await MediaContent.findByIdAndUpdate(mediaId, {
                    $inc: { useCount: 1 }
                });
                return;
            })
        );

        LOGGER.info(`Media use count increment successful`);
        res.status(200).json({
            status: 'success',
            message: 'Increment successful'
        });
    }
});

// controller to increment use count
const decrementUseCount = catchAsync(async (req, res) => {
    const idList = req.body.mediaId;

    if (idList.length < 1) {
        LOGGER.info(`No media found to decrease useCount`);
        res.status(200).json({
            status: 'success',
            message: 'No media found'
        });
    } else {
        await Promise.all(
            idList.map(async mediaId => {
                await MediaContent.findByIdAndUpdate(mediaId, {
                    $inc: { useCount: -1 }
                });
                return;
            })
        );

        LOGGER.info(`Media use count decrease successful`);
        res.status(200).json({
            status: 'success',
            message: 'Decrement successful'
        });
    }
});

// Controller to delete unused media
const deleteUnusedMedia = (req, res) => {
    const { adminType, franchiseeId } = req.params;

    // generate condition
    let condition = {};
    if (adminType === 'CA') condition = { adminType: 'CA', franchiseeId };
    else condition = { adminType: 'SA' };

    const mediaCondition = {
        ...condition,
        mediaType: { $in: ['audio', 'video', 'image'] },
        useCount: { $lt: 1 }
    };

    // Query to sum of all media by condition
    MediaContent.aggregate([
        {
            $match: mediaCondition
        },
        { $group: { _id: '$adminType', TotalSpace: { $sum: '$size' } } }
    ])
        .then(size => {
            let space = [];
            if (size && size.length > 0) {
                space = size[0].TotalSpace;
            }

            const mediaList = MediaContent.find(mediaCondition);
            return Promise.all([mediaList, space]);
        })
        .then(async ([mediaList, space]) => {
            let count = 0;
            await Promise.all(
                mediaList.map(async doc => {
                    count += 1;
                    await fsPromise.unlink(
                        `${config.MEDIA_ROOT}/${doc?.filePath}`
                    );
                })
            );

            return [space, count];
        })
        .then(([space, count]) => {
            const deleteContent = MediaContent.deleteMany(mediaCondition);
            return Promise.all([space, count, deleteContent]);
        })
        .then(([space, count, deleteContent]) => {
            const updatedConfig = SubscriberConfig.updateOne(condition, {
                $inc: { spaceUsages: -space }
            });

            return Promise.all([space, count, updatedConfig]);
        })
        .then(([space, count, updatedConfig]) => {
            let message;
            let volume = 0;
            if (space & count) {
                volume = space / 1000 / 1000;
                message = `Total ${count} files deleted & ${volume} MB space released`;
            } else message = 'No unused file found';

            LOGGER.info(
                `Total ${count} files deleted & ${volume} MB space released for admin Type '${adminType}' and franchisee ${franchiseeId}`
            );

            res.status(200).json({
                status: 'success',
                message
            });
        })
        .catch(err => {
            LOGGER.error(
                `Batch delete unsuccessful for admin Type ${adminType} and franchisee ${franchiseeId}`
            );
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

// controller to update total media space in subscriberConfig
const mediaUsedDataCorrection = (req, res) => {
    MediaContent.aggregate([
        {
            $match: {
                adminType: 'CA'
            }
        },
        {
            $group: {
                _id: '$franchiseeId',
                TotalSpace: { $sum: '$size' }
            }
        }
    ])
        .then(
            catchAsync(async spaceByFranchiseeList => {
                await Promise.all(
                    spaceByFranchiseeList.map(async doc => {
                        await SubscriberConfig.updateOne(
                            { franchiseeId: doc?._id },
                            {
                                $set: {
                                    spaceUsages: doc?.TotalSpace
                                }
                            }
                        );
                        return;
                    })
                );
            })
        )
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'Data upgradation done'
            });
        })
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            })
        );
};

module.exports = {
    uploadNew,
    getAllContent,
    searchMedia,
    getContent,
    updateContent,
    deleteContent,
    updatePath,
    incrementUseCount,
    decrementUseCount,
    deleteUnusedMedia,
    mediaUsedDataCorrection
};
