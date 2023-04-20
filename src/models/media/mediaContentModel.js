const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mediaContentSchema = Schema(
    {
        fileName: {
            type: String,
            trim: true,
            required: [true, 'A fileName is required']
        },
        // slug: String,
        adminType: {
            type: String,
            trim: true,
            upperCase: true,
            enum: ['SA', 'CA'],
            default: '',
            required: [true, 'A mail config must have a adminType']
        },
        franchiseeId: {
            type: Schema.Types.ObjectId,
            ref: 'Franchisee'
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business'
        },
        filePath: {
            type: String,
            trim: true,
            required: [true, 'A filePath is required']
        },
        mediaType: {
            // image, audio, view etc
            type: String,
            trim: true,
            required: [true, 'A contentType is required'],
            enum: ['audio', 'video', 'image', 'pdf', 'excel', 'csv'],
            lowercase: true
        },
        contentType: {
            // image/jpg, image/jpeg, audio/mp3, video/mp4 etc
            type: String,
            trim: true,
            required: [true, 'A contentType is required']
        },
        altText: {
            type: String,
            trim: true
        },
        caption: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        size: Number,
        useCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

// create wildcard text indexes for search queries
mediaContentSchema.index(
    { fileName: 'text', altText: 'text', caption: 'text', description: 'text' },
    {
        name: 'MyTextIndex'
    }
);

module.exports = mongoose.model('MediaContent', mediaContentSchema);
