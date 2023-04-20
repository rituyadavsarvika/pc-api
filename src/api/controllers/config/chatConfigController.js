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
        let twakTo = {
            adminType: "",
            active: true,
            _id: '',
            propertyId: "",
            chatId: "",
            name: true,
            chatType: "",
            franchiseeId: "",
        }

        if (chatConfig?.length) {
            twakTo.adminType = chatConfig[0]?.adminType
            twakTo.active = chatConfig[0]?.active
            twakTo._id = chatConfig[0]?._id
            twakTo.propertyId = chatConfig[0]?.propertyId
            twakTo.chatId = chatConfig[0]?.chatId
            twakTo.name = chatConfig[0]?.name
            twakTo.chatType = chatConfig[0]?.chatType
            twakTo.franchiseeId = chatConfig[0]?.franchiseeId
        }

        let manyChat = chatConfig[0]?.manyChatDetails || []

        // delete twakTo.manyChatDetails

        res.status(200).json({
            status: 'success',
            result: docCount,
            data: {
                twakTo: twakTo,
                manyChat
            }
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
        .then(updatedConfig => {
            res.status(200).json({
                status: 'success',
                data: updatedConfig
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
};

// create chat Config Many
const createChatConfigMany = catchAsync(async (req, res) => {
    const newChatConfig = await ChatConfig.create(req.body);

    res.status(201).json({
        status: 'success',
        data: newChatConfig
    });
});

// update chat config many
const updateChatConfigMany = catchAsync(async (req, res) => {
    // ChatConfig.findByIdAndUpdate(req.params.id, req.body, {
    //     new: true,
    //     runValidators: true
    // })
    //     .then(updatedConfig => {
    //         res.status(200).json({
    //             status: 'success',
    //             data: updatedConfig
    //         });
    //     })
    //     .catch(err => {
    //         res.status(500).json({
    //             status: 'fail',
    //             message: `${err.name} ${err.message}`
    //         });
    //     });

    const { adminType, franchiseeId } = req.query;
    let condition = undefined;

    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
    } else {
        condition = { adminType: 'CA', franchiseeId };
    }

    console.log("req?.body:::", req?.body);
    console.log("condition:::", condition);

    ChatConfig.updateMany(
        condition,
        { $set: req?.body },
        {
            upsert: false
        }
    )
        .then(updatedConfig => {
            res.status(200).json({
                status: 'success',
                data: updatedConfig
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'fail',
                message: `${err.name} ${err.message}`
            });
        });
});

// get all chat config
const getChatConfigMany = catchAsync(async (req, res) => {
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
        // delete twakTo.manyChatDetails

        res.status(200).json({
            status: 'success',
            result: docCount,
            data: chatConfig[0]
        });
    });
});

module.exports = {
    CreateChatConfig,
    getAllChatConfig,
    getChatConfig,
    updateChatConfig,
    createChatConfigMany,
    updateChatConfigMany,
    getChatConfigMany
};
