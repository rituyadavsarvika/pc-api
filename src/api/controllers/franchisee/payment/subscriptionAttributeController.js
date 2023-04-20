// Load utils
const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');

// Load Model
const SubscriptionAttribute = require('../../../../models/franchisee/payment/subscriptionAttributModel');

// create new subscription attribute
const createSubscriptionAttribute = catchAsync(async (req, res) => {
    const { name } = req.body;
    const newAttribute = await SubscriptionAttribute.create({ name });
    res.status(201).json({ status: 'success', data: newAttribute });
});

// get All attribute
const getAllSubscriptionAttributes = catchAsync(async (req, res) => {
    const feature = new APIFeature(SubscriptionAttribute.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const attributeList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        SubscriptionAttribute.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([attributeList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: attributeList
        });
    });
});

// get attribute details by Id
const getSubscriptionAttributeById = catchAsync(async (req, res) => {
    const attributeDetails = await SubscriptionAttribute.findOne({
        _id: req.params.id
    });

    res.status(200).json({
        status: 'success',
        data: attributeDetails
    });
});

// update Attribute
const updateSubscriptionAttributeById = catchAsync(async (req, res) => {
    const { name } = req.body;
    const updatedAttribute = await SubscriptionAttribute.findByIdAndUpdate(
        req.params.id,
        { $set: { name } },
        {
            new: true,
            runValidators: true
        }
    );
    res.status(200).json({ status: 'Success', data: updatedAttribute });
});

// delete attribute
const deleteSubscriptionAttribute = catchAsync(async (req, res) => {
    await SubscriptionAttribute.deleteOne({ _id: req.params.id });
    res.status(200).json({
        status: 'Success',
        message: 'Subscription attribute deleted Successfully'
    });
});

module.exports = {
    createSubscriptionAttribute,
    getAllSubscriptionAttributes,
    getSubscriptionAttributeById,
    updateSubscriptionAttributeById,
    deleteSubscriptionAttribute
};
