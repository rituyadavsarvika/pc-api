const mongoose = require('mongoose');

const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');

// Load Model
const PageBuilder = require('./../../../models/website/pageBuilderModel');

// Load service
const BuilderMigrationService = require('./../../../../service/builderMigration');

// controller to insert or update pages
const upsertBuilder = catchAsync(async (req, res) => {
    const { id, name, adminType, franchiseeId, content, isTemplate, status } = req.body;

    // console.log("req.body:::", req.body);

    const newBuilder = await PageBuilder.updateOne(
        { _id: id || mongoose.Types.ObjectId() },
        {
            name,
            adminType,
            franchiseeId,
            content,
            isTemplate,
            status
        },
        { upsert: true, runValidators: true }
    );

    const pk = newBuilder?.upserted ? newBuilder?.upserted[0]?._id : null;

    res.status(201).json({
        status: 'success',
        builderId: pk
    });
});

/* Controller to return All pages.
this Controller support all filter, search, sort, pagination, fields limiting
*/
const getAll = catchAsync(async (req, res) => {
    const { adminType, isTemplate } = req.query

    if (adminType !== 'SA' && !isTemplate) {
        req.query.status = 'publish';
    }

    const feature = new APIFeature(PageBuilder.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const lists = await feature.query;

    // get count
    const cQuery = new APIFeature(
        PageBuilder.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([lists, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: lists
        });
    });
});

// controller to return details by id
const getDetails = catchAsync(async (req, res) => {
    const content = await PageBuilder.findOne({
        _id: req.params.id,
        // status: 'publish'
    });

    res.status(200).json({
        status: 'success',
        data: content
    });
});

// controller to delete page builder
const deleteById = catchAsync(async (req, res) => {
    await PageBuilder.deleteOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

// Controller to update media path
const updateMediaPath = (req, res) => {
    const { adminType, franchiseeId } = req.body;
    const code = req.code;

    let condition = {};

    if (adminType === 'SA') condition = { adminType: 'SA' };
    else condition = { adminType: 'CA', franchiseeId };

    PageBuilder.find(condition)
        .then(docs => {
            docs.map(
                catchAsync(async doc => {
                    content = JSON.stringify(doc?.content);
                    content = content.replace(/superadmin/g, code);

                    await PageBuilder.findByIdAndUpdate(doc._id, {
                        content: JSON.parse(content)
                    });
                })
            );
            res.status(200).json({
                status: 'success'
            });
        })
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            })
        );
};

// use Builder Template API
const replaceMediaPath = (req, res) => {
    const replaceObject = req.replaceObject;
    let content = req.body.content;
    content = JSON.stringify(content);

    for (const oldPath in replaceObject) {
        content = content.replace(oldPath, replaceObject[oldPath]);
    }

    content = JSON.parse(content);

    res.status(200).json({
        status: 'success',
        content
    });
};

// Increment download count by 1
const IncrementDownloadCount = catchAsync(async (req, res) => {
    const newBuilder = await PageBuilder.findByIdAndUpdate(
        req.params.id,
        {
            $inc: { downloadCount: 1 }
        },
        {
            new: true,
            runValidators: true
        }
    ).select('downloadCount');

    res.status(200).json({ status: 'success', data: newBuilder });
});

// Builder old data migration
const pageBuilderMigration = (req, res) => {
    PageBuilder.find({})
        .then(
            catchAsync(async builderList => {
                await Promise.all(
                    builderList.map(builder => {
                        BuilderMigrationService.formatBuilderData(
                            builder?.content,
                            builder?.name
                        )
                            .then(formattedContent => {
                                return PageBuilder.findByIdAndUpdate(
                                    builder?.id,
                                    {
                                        content: formattedContent
                                    }
                                );
                            })
                            .then(updatedBuilder =>
                                console.log(`Update done for id ${builder?.id}`)
                            )
                            .catch(err => console.log('error', err));

                        return;
                    })
                );
            })
        )
        .then(() => {
            res.status(200).json({
                status: 'successful',
                message: 'Data migration done'
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err.message}`
            });
        });
};

// search page template
const searchPageTemplate = catchAsync(async (req, res) => {
    const { searchBy } = req.query;
    let condition;

    if (searchBy) {
        condition = new RegExp(`${searchBy}`, 'ig');
    } else {
        condition = /^/i;
    }

    const feature = new APIFeature(
        PageBuilder.find({
            name: {
                $regex: condition
            }
        }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const lists = await feature.query;

    // get count
    const cQuery = new APIFeature(
        PageBuilder.countDocuments({
            name: {
                $regex: condition
            }
        }),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([lists, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: lists
        });
    });
});

module.exports = {
    upsertBuilder,
    getAll,
    getDetails,
    deleteById,
    updateMediaPath,
    replaceMediaPath,
    IncrementDownloadCount,
    pageBuilderMigration,
    searchPageTemplate
};
