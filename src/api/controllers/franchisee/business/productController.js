// Load utils
const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');
const s3Service = require('./../../../../../service/s3service');

// Load Model
const Product = require('../../../../models/franchisee/business/productModel');

// Load utils
const fileUtil = require('./../../../../utils/generateFile');

// Create new product
const createProduct = catchAsync(async (req, res) => {
    // get fields
    // const name = req.body.name;
    // const slug = req.body.slug;
    // const summary = req.body.summary;
    // const details = req.body.details;
    // const tags = req.body.tags ? req.body.tags : undefined;
    // const categories = req.body.categories ? req.body.categories : undefined;
    // const businessId = req.body.businessId;
    // const franchiseeId = req.body.franchiseeId;
    // const shippingMethodId = req.body.shippingMethodId;
    // let publish = req.body.publish ? req.body.publish : false;
    // if (publish) {
    //     publish == 'true' || publish == '1';
    // }

    // const priceType = req.body.priceType;
    // const price = req.body.price ? parseFloat(req.body.price) : 0;
    // const minPrice = req.body.minPrice ? parseFloat(req.body.minPrice) : 0;
    // const maxPrice = req.body.maxPrice ? parseFloat(req.body.maxPrice) : 0;

    // console.log('slug', slug);
    // // create product
    // const productObj = {
    //     name,
    //     slug,
    //     summary,
    //     details,
    //     tags,
    //     categories,
    //     businessId,
    //     franchiseeId,
    //     shippingMethodId,
    //     publish,
    //     priceType,
    //     price,
    //     minPrice,
    //     maxPrice
    // };

    // console.log('productObj', productObj);

    // Save to database
    const product = await Product.create(req.body);

    res.status(201).json({
        status: 'success',
        data: product
    });
});

// Get All product
const getAllProduct = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        Product.find()
            .populate({
                path: 'tags',
                model: 'Tag',
                select: 'name slug'
            })
            .populate({
                path: 'categories',
                model: 'Category',
                select: 'name slug'
            })
            // .populate({
            //     path: 'businessId',
            //     model: 'Vendor',
            //     select: 'name'
            // })
            .populate({
                path: 'franchiseeId',
                model: 'Franchisee',
                select: 'name'
            })
            .populate({
                path: 'shippingMethodId',
                model: 'ShippingMethod',
                select: 'name'
            }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const productList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Product.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([productList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: productList
        });
    });
});

// get all filter product
const getFilteredProduct = catchAsync(async (req, res, next) => {
    const { categories, businesses, tags } = req.body;
    let query = {};

    // if categories exist in filter
    if (categories && Array.isArray(categories) && categories.length > 0) {
        query = {
            categories: {
                $in: categories
            }
        };
    }

    // if businesses exist in filter list
    if (businesses && Array.isArray(businesses) && businesses.length > 0) {
        query.businessId = {
            $in: businesses
        };
    }

    // if tags exist in filter list
    if (tags && Array.isArray(tags) && tags.length > 0) {
        query.tags = {
            $in: tags
        };
    }

    const feature = new APIFeature(
        Product.find(query)
            .populate({
                path: 'tags',
                model: 'Tag',
                select: 'name'
            })
            .populate({
                path: 'categories',
                model: 'Category',
                select: 'name'
            })
            // .populate({
            //     path: 'businessId',
            //     model: 'Vendor',
            //     select: 'name'
            // })
            .populate({
                path: 'franchiseeId',
                model: 'Franchisee',
                select: 'name'
            })
            .populate({
                path: 'shippingMethodId',
                model: 'ShippingMethod',
                select: 'name'
            }),
        req.query
    )
        .filter()
        .limitFields()
        .paginate();
    const productList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Product.countDocuments(query),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([productList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: productList
        });
    });
});

// get a single product
const getProduct = catchAsync(async (req, res) => {
    const { slug, franchiseeId } = req.params;
    const product = await Product.findOne({ slug, franchiseeId })
        .populate({
            path: 'tags',
            model: 'Tag',
            select: 'name'
        })
        .populate({
            path: 'categories',
            model: 'Category',
            select: 'name'
        })
        // .populate({
        //     path: 'businessId',
        //     model: 'Vendor',
        //     select: 'name'
        // })
        .populate({
            path: 'franchiseeId',
            model: 'Franchisee',
            select: 'name'
        })
        .populate({
            path: 'shippingMethodId',
            model: 'ShippingMethod',
            select: 'name'
        });

    res.status(200).status(200).json({
        status: 'success',
        data: product
    });
});

// Update Product
const updateProduct = catchAsync(async (req, res) => {
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: updatedProduct
    });
});

// Upload product Images
const uploadImages = (req, res) => {
    const images = req.body.files ? req.body.files.images : undefined;
    if (images && images.length > 0) {
        fileUtil
            .getData(images)
            .then(
                catchAsync(async locationList => {
                    const updatedProduct = await Product.findOneAndUpdate(
                        { _id: req.params.id },
                        {
                            $push: {
                                'images.links': { $each: locationList }
                            }
                        },
                        {
                            new: true
                        }
                    );
                    return res.status(200).json({
                        status: 'success',
                        data: updatedProduct
                    });
                })
            )
            .catch(err => {
                return res.status(500).json({ status: 'fail', message: err });
            });
    } else {
        return res.status(200).json({
            status: 'success',
            message: 'Nothing to upload. Please select a file'
        });
    }
};

// delete image from product image list
const removeImage = catchAsync(async (req, res) => {
    const link = req.body ? req.body.link : undefined;

    // remove from product document
    const updatedProduct = await Product.findOneAndUpdate(
        { _id: req.params.id },
        {
            $pull: {
                'images.links': {
                    $in: link
                }
            }
        },
        { new: true }
    );
    // delete that image from s3 bucket
    s3Service.deleteFile(link);

    // send updated product document as a response
    res.status(200).json({
        status: 'success',
        product: updatedProduct
    });
});

/**
 * @param  {async} it's an async function
 * @param  {req} request
 * @param  {res} response
 * @description Delete Product By _id
 */
const deleteProduct = catchAsync(async (req, res) => {
    await Product.deleteOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

module.exports = {
    createProduct,
    getAllProduct,
    getFilteredProduct,
    getProduct,
    updateProduct,
    uploadImages,
    removeImage,
    deleteProduct
};
