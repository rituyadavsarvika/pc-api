const catchAsync = require('../../../utils/error/catchAsync');
const APIFeature = require('../../../utils/apiFeatures');

// Load Model
const ChatConfig = require('../../../models/config/chatConfigModel');

// create chat Config
const CreateChatConfig = catchAsync(async (req, res) => {
    const newChatConfig = await ChatConfig.create(req.body);
    res.status(201).json({
        status: 'success',
        data: newChatConfig
    });
});

// get all chat config
const getAllChatConfig = catchAsync(async (req, res) => {
    const feature = new APIFeature(ChatConfig.find(), req.query)
        .filter()
        .limitFields()
        .paginate();
    const chatConfig = await feature.query;

    // get count
    const cQuery = new APIFeature(
        ChatConfig.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([chatConfig, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: chatConfig
        });
    });
});

// get a chat config by id
const getChatConfig = catchAsync(async (req, res) => {
    const chatConfig = await ChatConfig.findOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        data: chatConfig
    });
});

// update chat config by id
const updateChatConfig = (req, res) => {
    ChatConfig.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
        .then(updatedConfig =>
            res.status(200).json({
                status: 'success',
                data: updatedConfig
            })
        )
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            })
        );
};

module.exports = {
    CreateChatConfig,
    getAllChatConfig,
    getChatConfig,
    updateChatConfig
};
