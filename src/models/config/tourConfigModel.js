const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tourConfigSchema = Schema(
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
        active: {
            type: Boolean,
            default: true
        },
        tours: [{
            tourType: {
                type: String,
                required: [true, 'Tour Type is required'],
                trim: true,
                upperCase: true,
                enum: [
                    'DASHBOARD',
                    'PAGE',
                    'BUILDER',
                    'BLOG',
                ]
            },
            status: {
                type: String,
                default: 'PENDING',
                enum: [
                    'PENDING',
                    'COMPLETE',
                    'SKIP',
                ]
            },
            stepRunning: {
                type: Number,
                default: 1
            },
            currentPage: {
                type: String,
                default: ""
            },
        }]
    },
    { timestamps: true }
);

const TourConfig = mongoose.model('TourConfig', tourConfigSchema);
module.exports = TourConfig;
