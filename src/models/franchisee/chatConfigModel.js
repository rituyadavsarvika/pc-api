const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatConfigSchema = Schema(
    {
        chatType: {
            type: String,
            required: [true, 'chatType is required'],
            trim: true,
            enum: ['twakto', 'manychat']
        },
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
            ref: 'Franchisee'
        },
        active: {
            type: Boolean,
            default: true
        },
        propertyId: String,
        chatId: String,
        manyChatDetails: [
            {
                serviceType: {
                    type: String,
                    required: true,
                    trim: true,
                    enum: [
                        'FACEBOOKMESSENGER',
                        'INSTAGRAM',
                        'WHATSAPP',
                        'TELEGRAM'
                    ]
                },
                serviceCode: {
                    type: String,
                    trim: true,
                    required: true
                }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('ChatConfig', chatConfigSchema);
