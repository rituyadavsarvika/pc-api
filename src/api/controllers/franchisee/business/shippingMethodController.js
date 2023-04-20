const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');

const Model = require('./../../../../models/franchisee/business/shippingMethodModel');

/**
 * @description Create business wise New Shipping Method
 * @param {request} req
 * @param {response} res
 */
const createMethod = catchAsync(async (req, res) => {
    const {
        name,
        franchiseeId,
        adminType,
        businessId,
        minDays,
        maxDays,
        cost,
        isDefault
    } = req.body;

    const newMethod = await Model.create({
        name,
        franchiseeId,
        adminType,
        businessId,
        minDays,
        maxDays,
        cost,
        isDefault
    });

    res.status(201).json({ status: 'success', data: newMethod });
});

/**
 * @description Get All shipping method.
 * @param {request} req. user can pass query parameters to filer, search, sort, pagination
 * @param {response} res
 * @example use fields=fieldName1,fieldName2 to filter data
 * @example use sort=fieldName1,-fieldName2
 * @example search=searchText
 * @pagination use page=pageNo&limit=noOfData
 */
const GetAllMethods = catchAsync(async (req, res) => {
    const feature = new APIFeature(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // const dataList = await feature.query;
    const dataList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Model.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([dataList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: dataList
        });
    });
});

/**
 * @description get a shipping method by id
 * @param {request} req
 * @param {response} res
 */
const getAMethod = catchAsync(async (req, res) => {
    const shippingMethod = await Model.findOne({ _id: req.params.id })
        .populate({
            path: 'businessId',
            model: 'Business',
            select: 'name'
        })
        .populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        });
    res.status(200).json({ status: 'success', data: shippingMethod });
});

/**
 * @description update a shipping method by id
 * @param {request} req
 * @param {response} res
 */
const updateMethod = (req, res) => {
    Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
        .then((updatedMethod) => {
            res.status(200).json({
                status: 'success',
                data: updatedMethod
            });
        })
        .catch((err) => {
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

const deleteMethod = catchAsync(async (req, res) => {
    await Model.deleteOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

const changeDefault = (req, res) => {
    const shippingId = req.params.shippingId;
    const { franchiseeId } = req.body;

    // set active to provided config id
    Model.findByIdAndUpdate(
        shippingId,
        { $set: { isDefault: true } },
        {
            new: true,
            runValidators: true
        }
    )
        .exec()
        .then((updatedMethod) => {
            // set others config as inactive
            Model.updateMany(
                { franchiseeId, _id: { $ne: shippingId } },
                { $set: { isDefault: false } }
            )
                .then(() => {
                    res.status(200).json({
                        status: 'success',
                        data: updatedMethod
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        status: 'fail',
                        message: `${err.name} ${err.message}`
                    });
                });
        })
        .catch((err) => {
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

module.exports = {
    createMethod,
    getAMethod,
    GetAllMethods,
    updateMethod,
    deleteMethod,
    changeDefault
};
