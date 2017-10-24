const moment = require('moment');
// eslint-disable-next-line no-unused-vars
require('twix');

function getValidDateRange(startDate, endDate, dateRange) {
    const userTwix = moment(startDate).twix(endDate || dateRange.end);
    const rangeTwix = moment(dateRange.start).twix(dateRange.end);

    if (!userTwix.overlaps(rangeTwix)) return null;
    if (userTwix.engulfs(rangeTwix)) return dateRange;

    const intersection = userTwix.intersection(rangeTwix);
    return {
        start: intersection.start().format('Y-MM-DD'),
        end: intersection.end().format('Y-MM-DD'),
    };
}

module.exports = {
    getValidDateRange,
};