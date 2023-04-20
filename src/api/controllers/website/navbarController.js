const mongoose = require('mongoose');

// load utils
const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');
const Validator = require('./../../../utils/validator');

// load Model
const Navbar = require('./../../../models/website/navBarModel');

// controller to create or updated depending on id
const upsertNavbar = catchAsync(async (req, res) => {
    const { id } = req.body;

    // remove active form body object
    delete req.body['active'];

    const newNavbar = await Navbar.updateOne(
        { _id: id || mongoose.Types.ObjectId() },
        req.body,
        { upsert: true, runValidators: true }
    );

    const pk = newNavbar?.upserted ? newNavbar?.upserted[0]?._id : null;

    res.status(201).json({
        status: 'success',
        navbarId: pk
    });
});

// controller to get all navbar. this controller gives option to filter, paginate, limiting fields
const getAllNavbar = catchAsync(async (req, res) => {
    const feature = new APIFeature(Navbar.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const navbarList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Navbar.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([navbarList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: navbarList
        });
    });
});

// controller to set active by id. and others navbar will set as inactive
const setActive = (req, res) => {
    const { navbarId } = req.params;
    const { adminType, franchiseeId } = req.body;

    // set false by adminType and franchisee block
    Navbar.updateMany({ adminType, franchiseeId }, { $set: { active: false } })
        .then(() => {
            return Navbar.updateOne(
                { _id: navbarId },
                { $set: { active: true } }
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

// controller to get active footer. if no custom design found, then pass from menus section
const getActive = catchAsync(async (req, res) => {
    const { adminType, franchiseeId } = req.params;
    let condition = {};
    let navbarCondition = {};
    if (adminType === 'SA') {
        condition = { adminType, active: true };
        navbarCondition = { adminType, primaryMenu: true };
    } else {
        condition = { adminType, franchiseeId, active: true };
        navbarCondition = { adminType, franchiseeId, primaryMenu: true };
    }

    const designNavbar = await Navbar.findOne(condition);
    if (Validator.isEmptyObject(designNavbar)) {
        const navbarMenu = await Menu.findOne(navbarCondition);
        if (Validator.isEmptyObject(navbarMenu)) {
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
                    _id: navbarMenu._id,
                    name: navbarMenu.name,
                    content: navbarMenu.content
                }
            });
        }
    } else {
        res.status(200).json({
            status: 'success',
            design: 'custom',
            data: {
                _id: designNavbar._id,
                name: designNavbar.name,
                content: designNavbar.content
            }
        });
    }
});

// controller to get Navbar by id
const getDetailsById = catchAsync(async (req, res) => {
    const navbar = await Navbar.findOne({ _id: req.params.navbarId }).select(
        '-_id -__v -isTemplate -createdAt -updatedAt'
    );

    res.status(200).json({
        status: 'success',
        data: navbar
    });
});

// Controller to delete by id
const deleteById = catchAsync(async (req, res) => {
    await Navbar.deleteOne({ _id: req.params.navbarId });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

// controller to search navbar

// search page template
const searchNavbar = catchAsync(async (req, res) => {
    const { searchBy } = req.query;
    let condition;

    if (searchBy) {
        condition = new RegExp(`${searchBy}`, 'ig');
    } else {
        condition = /^/i;
    }

    const feature = new APIFeature(
        Navbar.find({
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
        Navbar.countDocuments({
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
    upsertNavbar,
    getAllNavbar,
    setActive,
    getActive,
    getDetailsById,
    deleteById,
    searchNavbar
};
