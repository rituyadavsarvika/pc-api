const axios = require('axios');

const catchAsync = require('./../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');
const Validator = require('./../../../../utils/validator');

// Load model
const ServiceIntegration = require('./../../../../models/franchisee/integration/serviceIntegrationModel');

// create new service name
const createNewService = catchAsync(async (req, res) => {
    const newService = await ServiceIntegration.create(req.body);

    res.status(201).json({ status: 'success', data: newService });
});

// get all service
const getAllService = catchAsync(async (req, res) => {
    const feature = new APIFeature(ServiceIntegration.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const serviceList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        ServiceIntegration.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([serviceList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: serviceList
        });
    });
});

// Get details by service name
const getServiceById = catchAsync(async (req, res) => {
    console.log('Hello');
    const serviceId = req.params.serviceId;
    const serviceDetails = await ServiceIntegration.findOne({
        _id: serviceId
    });

    res.status(200).json({
        status: 'success',
        data: serviceDetails
    });
});

// update service by name
const updateServiceById = catchAsync(async (req, res) => {
    const serviceId = req.params.serviceId;

    const updatedService = await ServiceIntegration.findByIdAndUpdate(
        { _id: serviceId },
        req.body,
        {
            new: true,
            runValidators: true
        }
    );
    res.status(200).json({ status: 'success', data: updatedService });
});

// delete by
const deleteServiceById = catchAsync(async (req, res) => {
    const serviceId = req.params.serviceId;
    await ServiceIntegration.deleteOne({ _id: serviceId });

    res.status(200).json({
        status: 'Success',
        message: 'Service deleted Successfully'
    });
});

// controller to get rentmy access token
const getRentmyToken = catchAsync(async (req, res) => {
    const { apiKey, secretKey } = req;

    const response = await axios({
        method: 'post',
        url: 'apps/access-token',
        baseURL: 'https://clientapi.rentmy.co/api/',
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            api_key: apiKey,
            api_secret: secretKey
        }
    });
    const { result } = response?.data;

    if (result.hasOwnProperty('data'))
        res.status(200).json({
            status: 'success',
            data: result.data
        });
    else
        res.status(500).json({
            status: 'fail',
            message: 'Invalid API key or Secret Key'
        });
});

module.exports = {
    createNewService,
    getAllService,
    getServiceById,
    updateServiceById,
    deleteServiceById,
    getRentmyToken
};
