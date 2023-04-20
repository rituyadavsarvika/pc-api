// Load utils
const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');
const DataFormat = require('./../../../utils/dataFormate');

// Load Model
const Category = require('../../../models/franchisee/categoryModel');
const AppError = require('../../../utils/error/appError');

// Create New category
const create = catchAsync(async (req, res) => {
    const newCategory = await Category.create(req.body);

    res.status(201).json({
        status: 'success',
        data: newCategory
    });
});

// Get All category
const getAll = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        Category.find()
            .populate({
                path: 'parentId',
                model: 'Category',
                select: 'name'
            })
            .populate({
                path: 'franchiseeId',
                model: 'Franchisee',
                select: 'name'
            }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const categoryList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Category.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([categoryList]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: categoryList
        });
    });
});

// Get a specific category by id
const getCategory = catchAsync(async (req, res) => {
    const category = await Category.findOne({
        _id: req.params.id
    })
        .populate({
            path: 'parentId',
            model: 'Category',
            select: 'name'
        })
        .populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        });

    res.status(200).json({
        status: 'success',
        data: category
    });
});

// Update Category
const updateCategory = catchAsync(async (req, res) => {
    let { parentId } = req.body;
    let data = {};

    data.$set = req.body;
    if (!parentId) {
        data.$unset = {
            parentId: ''
        };
    }

    const newCategory = await Category.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: newCategory
    });
});

// get all category by Hierarchy
const getByHierarchy = (req, res, next) => {
    const feature = new APIFeature(
        Category.find().select('name parentId'),
        req.query
    ).filter();

    feature.query
        .then(categoryList => {
            DataFormat.generateHierarchy(categoryList)
                .then(categoryHierarchy => {
                    res.status(200).json({
                        status: 'success',
                        category: categoryHierarchy
                    });
                })
                .catch(err =>
                    next(new AppError(`${err.name} ${err.message}`, 500))
                );
        })
        .catch(err => next(new AppError(`${err.name} ${err.message}`, 500)));
};

module.exports = {
    create,
    getAll,
    getCategory,
    updateCategory,
    getByHierarchy
};
