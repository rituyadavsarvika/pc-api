const moment = require('moment'); // require
moment().format();
const catchAsync = require('./error/catchAsync');

// a function to return date object from a date string
const dateFormat = (inputDate, formate) => {
    return new Promise((resolve, reject) => {
        dateString = moment(inputDate.toString(), formate);
        resolve(dateString);
    });
};

// a function to return start and end of a specific date String in string formate
const generateSearchAbleDate = async (dateString, formate) => {
    const dateObject = await dateFormat(dateString, formate);

    startSearchDate = dateObject.parseZone().utc().startOf('day').toDate();
    endSearchDate = dateObject.parseZone().utc().endOf('day').toDate();

    return new Promise((resolve, reject) => {
        resolve({ startSearchDate, endSearchDate });
    });
};

const addDays = (date, days) => {
    days = parseInt(days, 10);
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

module.exports = { dateFormat, generateSearchAbleDate, addDays };
