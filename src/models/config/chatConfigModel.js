const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatConfigSchema = Schema(
    {
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'Admin type is required']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee',
            unique: true,
        },
        active: String,
        propertyId: String,
        chatId: String,
        name: String,
        chatType: String,
        manyChatDetails: Array,
        chats: [{
            chatType: {
                type: String,
                required: [true, 'chatType is required'],
                trim: true,
                upperCase: true,
                enum: [
                    'TWAKTO',
                    'MC-FB',
                    'MC-WHATSAPP',
                    'MC-TELEGRAM',
                ]
            },
            name: {
                type: String,
                required: [true, 'Name is required'],
                trim: true
            },
            active: {
                type: Boolean,
                default: false
            },
            propertyId: {
                type: String,
            },
            chatId: {
                type: String,
            }
        }]
        // manyChatDetails: [
        //     {
        //         serviceType: {
        //             type: String,
        //             trim: true,
        //             enum: [
        //                 'FACEBOOKMESSENGER',
        //                 'INSTAGRAM',
        //                 'WHATSAPP',
        //                 'TELEGRAM'
        //             ]
        //         },
        //         serviceCode: {
        //             type: String,
        //         }
        //     }
        // ],
    },
    { timestamps: true }
);

const ChatConfig = mongoose.model('ChatConfig', chatConfigSchema);
module.exports = ChatConfig;
