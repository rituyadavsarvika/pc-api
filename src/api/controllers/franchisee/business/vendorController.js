// const jwt = require('jsonwebtoken');
const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');

// Load Model
const Vendor = require('../../../../models/franchisee/business/vendorModel');
const ShippingMethod = require('../../../../models/franchisee/business/shippingMethodModel');
const userModel = require('../../../../models/auth/usersModel');
const EmailRoleRel = require('../../../../models/emailRoleRel.model');

// This controller function will create a new business as well as a new user with business admin role
const vendorRegistration = catchAsync(async (req, res, next) => {
    let {
        name,
        email,
        password,
        confirmPassword,
        address,
        phone,
        categoryIds,
        franchiseeId,
        image,
        slug
    } = req.body;

    const newVendor = await Vendor.create({
        name,
        email,
        phone,
        address,
        categoryIds,
        franchiseeId,
        image,
        slug
    });

    // Create New default Shipping method
    const newShippingMethod = await ShippingMethod.create({
        name: 'General Shipping',
        franchiseeId: franchiseeId,
        businessId: newVendor._id,
        minDays: 1,
        maxDays: 3,
        cost: 5,
        isDefault: true
    });

    // create email role rel document
    // await EmailRoleRel.create({
    //     email,
    //     userRole: 'BUSINESSADMIN'
    // });

    // for super admin role should be SUPERADMIN
    // const newBusinessAdmin = await userModel.create({
    //     firstName: name,
    //     email,
    //     password,
    //     confirmPassword,
    //     address,
    //     phone,
    //     role: 'BUSINESSADMIN',
    //     businessId: newBusiness._id,
    //     franchiseeId
    // });

    Promise.all([newVendor, newShippingMethod]).then(() => {
        // Generate token
        // const token = getToken(newBusinessAdmin._id);
        res.status(201).json({
            status: 'success',
            data: newVendor
            // user: {
            //     firstName: newBusinessAdmin.firstName,
            //     lastName: newBusinessAdmin.lastName,
            //     email: newBusinessAdmin.email,
            //     role: newBusinessAdmin.role
            // }
        });
    });
});

// This function will return all business. here this function accept filed list to select,
//sort asc/desc, pagination (limit, page)
const getAllVendors = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        Vendor.find()
            .populate({
                path: 'categoryIds',
                model: 'VendorCategory',
                select: 'name'
            })
            .populate({
                path: 'franchiseeId',
                model: 'Franchisee',
                select: 'name'
            })
            .populate({
                path: 'image',
                model: 'MediaContent',
                select: 'filePath altText'
            }),

        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const vendors = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Vendor.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([vendors, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: vendors
        });
    });
});

// This function will return a specific business with business id
const getVendorById = catchAsync(async (req, res) => {
    const vendor = await Vendor.findOne({ _id: req.params.id })
        .populate({
            path: 'categoryIds',
            model: 'VendorCategory',
            select: 'name'
        })
        .populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        })
        .populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        });

    res.status(200).json({
        status: 'success',
        data: vendor
    });
});

// This function will update business document
const updateVendorId = catchAsync(async (req, res) => {
    const updatedVendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    )
        .populate({
            path: 'categoryIds',
            model: 'VendorCategory',
            select: 'name'
        })
        .populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        })
        .populate({
            path: 'image',
            model: 'MediaContent',
            select: 'filePath altText'
        });
    
    res.status(200).json({
        status: 'success',
        data: updatedVendor
    });
});

module.exports = {
    vendorRegistration,
    getAllVendors,
    getVendorById,
    updateVendorId
};
