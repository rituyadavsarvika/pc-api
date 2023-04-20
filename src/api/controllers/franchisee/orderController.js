const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');
const validator = require('../../../utils/validator');

// Load Order
const Order = require('../../../models/franchisee/orders.model');
const BusinessOrder = require('../../../models/franchisee/business/businessOrderModel');

// Load Utils
// const mathCalculation = require('./../../../utils/mathCalculation');
const AppError = require('../../../utils/error/appError');
const dateUtils = require('./../../../utils/dateTime');
const DATAFORMATER = require('../../../utils/dataFormate');
const emailService = require('./../../../../service/sendMail');

// Create New Order
const createNewOrder = catchAsync(async (req, res, next) => {
    let {
        orderDate,
        franchiseeId,
        subTotal,
        shippingCharge,
        total,
        paymentMethod,
        billingAddress,
        sameAsBilling,
        shippingAddress,
        vendorDetails,
        note
    } = req.body;

    // set shipping address
    if (sameAsBilling) {
        shippingAddress = billingAddress;
    }

    // generate parent order
    Order.create({
        orderNo: (
            await DATAFORMATER.generateUniqueNumber(10, true, true)
        ).toUpperCase(),
        orderDate,
        franchiseeId,
        subTotal,
        shippingCharge,
        total,
        billingAddress,
        shippingAddress,
        status: 'PAYMENT_PENDING',
        paymentMethod,
        note
    })
        .then(newOrder => {
            // generate sub orders
            vendorDetails.map(
                catchAsync(async vendor => {
                    BusinessOrder.create({
                        parentOrderId: newOrder._id,
                        orderNo: (
                            await DATAFORMATER.generateUniqueNumber(
                                10,
                                true,
                                true
                            )
                        ).toUpperCase(),
                        orderDate,
                        businessId: vendor.businessId,
                        subTotal: vendor.subTotal,
                        shippingId: vendor.shippingId,
                        shippingCharge: vendor.shippingCharge,
                        total: vendor.total,
                        products: vendor.products,
                        status: 'PAYMENT_PENDING',
                        billingAddress,
                        shippingAddress
                    });

                    // generate order notification with attached invoice
                    emailService
                        .orderMailNotification({
                            orderNo: newOrder.orderNo,
                            email: newOrder.billingAddress.email,
                            orderDate: newOrder.orderDate,
                            paymentMethod: newOrder.paymentMethod,
                            billingAddress: newOrder.billingAddress,
                            shippingAddress: newOrder.shippingAddress,
                            total: newOrder.total,
                            subTotal: newOrder.subTotal,
                            products: vendor.products,
                            status: newOrder.status
                        })
                        .then(() => console.log('Mail send successful'))
                        .catch(() => console.log('Mail send failed..'));
                })
            );

            res.status(200).json({
                status: 'success',
                message: 'Order created successfully',
                data: {
                    orderNumber: newOrder.orderNo
                }
            });
        })
        .catch(err => new AppError(`${err.name}, ${err.message}`, 500));
});

// get all orders
const getAllOrder = catchAsync(async (req, res) => {
    const feature = new APIFeature(Order.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const orderList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Order.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([orderList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: orderList
        });
    });
});

// get all order filtered by date
const filterBYDate = catchAsync(async (req, res) => {
    // get variables
    const dateString = req.body.searchDate;
    const franchiseeId = req.params.franchiseeId;

    // get start and end of a specific day
    const { startSearchDate, endSearchDate } =
        await dateUtils.generateSearchAbleDate(dateString, 'DD/MM/YYYY');

    // generate condition
    const condition = {
        franchiseeId,
        orderDate: {
            $gte: startSearchDate,
            $lt: endSearchDate
        }
    };

    // get oll orders filtered by date and franchisee with pagination
    const feature = new APIFeature(Order.find(condition), req.query)
        .limitFields()
        .paginate();
    const orderList = await feature.query;

    // get total search result count
    const cQuery = new APIFeature(
        Order.countDocuments(condition),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    res.status(200).json({
        status: 'success',
        result: docCount,
        data: orderList
    });
});

// get a specific order
const getOrder = catchAsync(async (req, res) => {
    const parentOrder = await Order.findOne({ _id: req.params.id });

    if (!validator.isEmptyObject(parentOrder)) {
        const {
            _id,
            billingAddress,
            shippingAddress,
            orderNo,
            orderDate,
            franchiseeId,
            subTotal,
            shippingCharge,
            total,
            status,
            paymentMethod,
            note
        } = parentOrder;

        let formatData = {
            _id,
            billingAddress,
            shippingAddress,
            orderNo,
            orderDate,
            franchiseeId,
            subTotal,
            shippingCharge,
            total,
            status,
            paymentMethod,
            note
        };
        formatData.vendorDetails = [];
        // get al sub orders
        BusinessOrder.find({
            parentOrderId: _id
        })
            .populate({
                path: 'businessId',
                model: 'Business',
                select: 'name'
            })
            .populate({
                path: 'shippingId',
                model: 'ShippingMethod',
                select: 'name minDays maxDays'
            })
            .populate({
                path: 'products.id',
                model: 'Product',
                select: 'name images'
            })
            .populate({
                path: 'products.greetings.id',
                model: 'Product',
                select: 'name images'
            })
            .then(subOrders => {
                let vendorDetails = [];
                // check if sub orders exist or not
                if (subOrders && subOrders.length > 0) {
                    subOrders.map(suborder => {
                        vendorDetails.push({
                            businessId: suborder.businessId,
                            orderNo: suborder.orderNo,
                            orderId: suborder._id,
                            orderDate: suborder.orderDate,
                            shippingId: suborder.shippingId,
                            subtotal: suborder.subTotal,
                            shippingCharge: suborder.shippingCharge,
                            total: suborder.total,
                            status: suborder.status,
                            products: suborder.products
                        });
                    });

                    formatData.vendorDetails = vendorDetails;
                } else {
                    formatData.vendorDetails = [];
                }

                res.status(200).status(200).json({
                    status: 'success',
                    message: 'data block',
                    data: formatData
                });
            });
    } else {
        res.status(200).status(200).json({
            status: 'success',
            data: parentOrder
        });
    }
});

// update order details
const updateOrder = catchAsync(async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: { status: req.body.status } },
        {
            new: true,
            runValidators: true
        }
    );

    Promise.all([updatedOrder]).then(() => {
        res.status(200).json({
            status: 'success',
            data: updatedOrder
        });
    });
});

module.exports = {
    createNewOrder,
    getAllOrder,
    filterBYDate,
    getOrder,
    updateOrder
};
