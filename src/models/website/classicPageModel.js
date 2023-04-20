const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classicPageSchema = Schema(
    {
        brandLogo: String,
        pageHeader: {
            title: {
                type: String,
                trim: true
            },
            image: String
        },
        pageFeature: [Object],
        pageAbout: {
            title: {
                type: String,
                trim: true
            },
            text: {
                type: String,
                trim: true
            },
            image: String
        },
        pageSlider: {
            itemsToShow: Number
        },
        pageContent: {
            type: String,
            trim: true
        },
        pageContact: {
            title: {
                type: String,
                trim: true
            },
            text: {
                type: String,
                trim: true
            }
        }
    },
    { timestamps: true }
);

const ClassicPage = mongoose.model('ClassicPage', classicPageSchema);
module.exports = ClassicPage;
