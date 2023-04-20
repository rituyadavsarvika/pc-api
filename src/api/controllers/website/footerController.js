const mongoose = require('mongoose');

const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');
const Validator = require('./../../../utils/validator');

// Load Model
const Footer = require('./../../../models/website/footerModel');
const Menu = require('./../../../models/website/menuModel');

// Load Service
const BuilderMigrationService = require('./../../../../service/builderMigration');

const upsertFooter = catchAsync(async (req, res) => {
    const { id } = req.body;

    // remove active form body object
    delete req.body['active'];

    const newFooter = await Footer.updateOne(
        { _id: id || mongoose.Types.ObjectId() },
        req.body,
        { upsert: true, runValidators: true }
    );

    const pk = newFooter?.upserted ? newFooter?.upserted[0]?._id : null;

    res.status(201).json({
        status: 'success',
        footerId: pk
    });
});

const getAllFooter = catchAsync(async (req, res) => {
    const feature = new APIFeature(Footer.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const footerList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Footer.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([footerList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: footerList
        });
    });
});

const getDetails = catchAsync(async (req, res) => {
    const footer = await Footer.findOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        data: footer
    });
});

// delete footer controller
const deleteFooter = catchAsync(async (req, res) => {
    await Footer.deleteOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

const setActive = async (req, res) => {
    const { footerId } = req.params;
    const { adminType, franchiseeId } = req.body;

    let isFooterActive = await Footer.findById({ _id: footerId }).select("active").exec()

    // set false by adminType and franchisee block
    Footer.updateMany({ adminType, franchiseeId }, { $set: { active: false } })
        .then(() => {
            return Footer.updateOne(
                { _id: footerId },
                { $set: { active: !isFooterActive?.active } }
            );
        })
        .then(() => {
            res.status(200).json({
                status: 'success',
                message: 'set active successful'
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

// controller to get active footer
const getActive = catchAsync(async (req, res) => {
    const { adminType, franchiseeId } = req.params;
    let condition = {};
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
            res.status(200).json({
                status: 'success',
                design: 'default',
                data: null
            });
        } else {
            res.status(200).json({
                status: 'success',
                design: 'default',
                data: {
                    _id: footerMenu._id,
                    name: footerMenu.name,
                    content: footerMenu.content
                }
            });
        }
    } else {
        res.status(200).json({
            status: 'success',
            design: 'custom',
            data: {
                _id: designFooter._id,
                name: designFooter.name,
                content: designFooter.content
            }
        });
    }
});

// Footers migration
const footerMigration = (req, res) => {
    Footer.find({})
        .then(
            catchAsync(async footerList => {
                await Promise.all(
                    footerList.map(footer => {
                        if (footer?.content) {
                            BuilderMigrationService.formatBuilderData(
                                footer?.content,
                                footer?.name
                            )
                                .then(formattedContent => {
                                    return Footer.findByIdAndUpdate(
                                        footer?.id,
                                        {
                                            content: formattedContent
                                        }
                                    );
                                })
                                .then(updatedFooter =>
                                    console.log(
                                        `Update done for id ${footer?.id}`
                                    )
                                )
                                .catch(err => console.log('error', err));
                        } else {
                            const content = {
                                name: '',
                                section: {
                                    ids: [],
                                    entries: {}
                                },
                                column: {},
                                component: {},
                                selected: null,
                                selectedType: ''
                            };

                            Footer.updateMany(
                                { _id: footer?.id },
                                {
                                    $unset: { footer: 1, social: 1 },
                                    $set: {
                                        content
                                    }
                                }
                            )
                                .then(updatedFooter =>
                                    console.log(
                                        `Update done for id ${footer?.id}`
                                    )
                                )
                                .catch(err => console.log('error', err));
                        }
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

    // res.status(200).json({
    //     status: 'successful',
    //     message: 'Data Correction done'
    // });
};

module.exports = {
    upsertFooter,
    getAllFooter,
    getDetails,
    deleteFooter,
    setActive,
    getActive,
    footerMigration
};
