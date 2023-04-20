const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');

// Load model
const VendorCategory = require('../../../../models/franchisee/business/vendorCategoryModel');

const create = catchAsync(async (req, res) => {
    const newVendorCategory = await VendorCategory.create(req.body);

    res.status(201).json({
        status: 'success',
        data: newVendorCategory
    });
});

const getVendorCategories = catchAsync(async (req, res) => {
    const feature = new APIFeature(VendorCategory.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const vendorCategories = await feature.query;

    // get count
    const cQuery = new APIFeature(
        VendorCategory.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([vendorCategories, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: vendorCategories
        });
    });
});

const getVendorCategoryById = catchAsync(async (req, res) => {
    const vendorCategory = await VendorCategory.findOne({
        _id: req.params.id
    });

    res.status(200).json({
        status: 'success',
        data: vendorCategory
    });
});

const updateVendorCategoryById = catchAsync(async (req, res) => {
    const updatedVendorCategory = await VendorCategory.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: updatedVendorCategory
    });
});

module.exports = {
    create,
    getVendorCategories,
    getVendorCategoryById,
    updateVendorCategoryById
};
