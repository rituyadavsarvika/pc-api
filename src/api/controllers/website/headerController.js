const mongoose = require('mongoose');

const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');
const Validator = require('../../../utils/validator');

// Load Model
const Header = require('../../../models/website/headerModel');
const Menu = require('../../../models/website/menuModel');

// Load Service
const BuilderMigrationService = require('../../../../service/builderMigration');

const upsertHeader = catchAsync(async (req, res) => {
    const { id } = req.body;

    // remove active form body object
    delete req.body['active'];

    const newHeader = await Header.updateOne(
        { _id: id || mongoose.Types.ObjectId() },
        req.body,
        { upsert: true, runValidators: true }
    );

    const pk = newHeader?.upserted ? newHeader?.upserted[0]?._id : null;

    res.status(201).json({
        status: 'success',
        headerId: pk
    });
});

const getAllHeader = catchAsync(async (req, res) => {
    const feature = new APIFeature(Header.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const headerList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Header.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([headerList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: headerList
        });
    });
});

const getDetails = catchAsync(async (req, res) => {
    const header = await Header.findOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        data: header
    });
});

// delete header controller
const deleteHeader = catchAsync(async (req, res) => {
    await Header.deleteOne({ _id: req.params.id });
    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

const setActive = async (req, res) => {
    const { headerId } = req.params;
    const { adminType, franchiseeId } = req.body;

    let isHeaderActive = await Header.findById({ _id: headerId }).select("active").exec()
    // set false by adminType and franchisee block
    Header.updateMany({ adminType, franchiseeId }, { $set: { active: false } })
        .then(() => {
            return Header.updateOne(
                { _id: headerId },
                { $set: { active: !isHeaderActive?.active } }
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

// controller to get active header
const getActive = catchAsync(async (req, res) => {
    const { adminType, franchiseeId } = req.params;
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
                    _id: headerMenu._id,
                    name: headerMenu.name,
                    content: headerMenu.content
                }
            });
        }
    } else {
        res.status(200).json({
            status: 'success',
            design: 'custom',
            data: {
                _id: designHeader._id,
                name: designHeader.name,
                content: designHeader.content
            }
        });
    }
});

// Headers migration
const headerMigration = (req, res) => {
    Header.find({})
        .then(
            catchAsync(async headerList => {
                await Promise.all(
                    headerList.map(header => {
                        if (header?.content) {
                            BuilderMigrationService.formatBuilderData(
                                header?.content,
                                header?.name
                            )
                                .then(formattedContent => {
                                    return Header.findByIdAndUpdate(
                                        header?.id,
                                        {
                                            content: formattedContent
                                        }
                                    );
                                })
                                .then(updatedHeader =>
                                    console.log(
                                        `Update done for id ${header?.id}`
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

                            Header.updateMany(
                                { _id: header?.id },
                                {
                                    $unset: { header: 1, social: 1 },
                                    $set: {
                                        content
                                    }
                                }
                            )
                                .then(updatedHeader =>
                                    console.log(
                                        `Update done for id ${header?.id}`
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
    upsertHeader,
    getAllHeader,
    getDetails,
    deleteHeader,
    setActive,
    getActive,
    headerMigration
};
