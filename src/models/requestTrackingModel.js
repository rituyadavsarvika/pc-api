const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestTrackingSchema = Schema(
    {
        originalUrl: String,
        clientIp: String,
        ip: String,
        method: String,
        osInfo: String,
        userAgent: String,
        requestedTime: Date,
        
    },
    { timestamps: true }
);

const RequestTracking = mongoose.model(
    'requestTracking',
    requestTrackingSchema
);
module.exports = RequestTracking;
