const catchAsync = require('./../../../utils/error/catchAsync');
const APIFeature = require('./../../../utils/apiFeatures');
const Validator = require('./../../../utils/validator');

// Load Model
const Menu = require('./../../../models/website/menuModel');

// create a new menu
const createMenu = catchAsync(async (req, res) => {
    const newMenu = await Menu.create(req.body);

    res.status(201).json({ status: 'success', data: newMenu });
});

// Get all menu. here you can set query parameter to get filter data
const getAllMenu = catchAsync(async (req, res) => {
    const feature = new APIFeature(Menu.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // const dataList = await feature.query;
    const dataList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        Menu.countDocuments(),
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

// Get a specific menu by menuId
const getMenu = catchAsync(async (req, res) => {
    const menu = await Menu.findOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        data: menu
    });
});

/**
 * @param {} async it's a asynchronous function
 * @param {req} request
 * @param {res} response
 * @description Delete menu item
 */
const deleteMenu = catchAsync(async (req, res) => {
    await Menu.deleteOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        message: 'Deleted Successfully'
    });
});

// Update menu by menu
const updateMenu = catchAsync(async (req, res) => {
    const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ status: 'success', data: updatedMenu });
});

const changePosition = catchAsync(async (req, res) => {
    const { adminType, franchiseeId, topMenu, primaryMenu, footerMenu } =
        req.body;

    // generate data to set false of that adminType
    let condition = undefined;
    let data = {};
    if (topMenu) data['topMenu'] = false;
    if (primaryMenu) data['primaryMenu'] = false;
    if (footerMenu) data['footerMenu'] = false;

    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
    } else {
        condition = { adminType: 'CA', franchiseeId };
    }

    // set false to others menu in this position
    if (!Validator.isEmptyObject(data)) {
        await Menu.updateMany(
            condition,
            { $set: data },
            {
                new: true,
                runValidators: true
            }
        );
    }

    // update menu information
    const updatedMenu = await Menu.findByIdAndUpdate(
        req.params.menuId,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({ status: 'success', updatedMenu });
});

// Update menu by menu
// const findMenuBySlug = catchAsync(async (req, res) => {
//     const menu = await Menu.findOne({ franchiseeId: '62f5dcb9f482180fc4682bfe', $text: { $search: `\"${req?.params?.slug}\"` } });

//     res.status(200).json({ status: 'success', data:{ count: menu?.length, menu} });
// });

module.exports = {
    createMenu,
    getAllMenu,
    getMenu,
    deleteMenu,
    updateMenu,
    changePosition,
    // findMenuBySlug
};
