const _ = require('lodash');
const moment = require('moment');

const Q = require('q');
const db = require('../db');
const util = require('../common/util');
const period = require('./period');
const User = require('./user');
const { query } = require('../pg');

function fmtDayDate(row) {
    return moment(row.day_date).format('YYYY-MM-DD');
}

function hasKeyPrefix(prefix) {
    return (value, key) => _.startsWith(key, prefix);
}

/**
 * fetches all days from a period and joins the user periods data to it if present
 *
 * @param userId
 * @param dateRange
 * @param periodTypes
 * @returns {*}
 */
function fetchPeriodsGroupedByDay(userId, dateRange, periodTypes) {
    const periodQuery = 'SELECT * FROM user_get_day_periods($1, $2::timestamp, $3::timestamp)';
    return query(periodQuery, [userId, dateRange.start.toISOString(), dateRange.end.toISOString()])
        .then((result) => {
            const grouped = _.groupBy(result.rows, fmtDayDate);
            const data = _.mapValues(grouped, (periods) => {
                // pick day fields from first period in list to get all props for the day
                const day = _.pickBy(_.head(periods), hasKeyPrefix('day_'));

                function transformPeriod(d) {
                    // only pick props that *do not* have a "day_" prefix
                    const periodData = _.omitBy(d, hasKeyPrefix('day_'));
                    return period.preparePeriodForApiResponse(periodData);
                }

                // filter empty periods
                const p = periods.map(transformPeriod).filter(pe => pe.per_id !== null);

                function calculateRemaining() {
                    const duration = _.reduce(
                        periods,
                        (res, per) => {
                            // map period type to period
                            const type = _.find(periodTypes, t => t.pty_id === per.per_pty_id);

                            if (!type || type.pty_id === 'Work') {
                                return res;
                            }

                            const diff = moment.duration(per.per_duration).subtract(moment.duration(per.break));

                            return res.subtract(diff);
                        },
                        moment.duration(day.day_target_time)
                    );

                    const minutes = duration.as('minutes');
                    const hours = Math.floor(minutes / 60);

                    return {
                        hours,
                        minutes: minutes % 60,
                    };
                }

                return Object.assign({}, day,
                    {
                        periods: p,
                        // calculate remaining target time after reducing holidays and all other non Work durations
                        // todo: maybe this should be done in the database
                        remaining: calculateRemaining(),
                    }
                );
            });
            return {
                days: _.sortBy(_.values(data), day => moment(day.day_date)),
            };
        });
}

/**
 * calculate carry data within the database
 *
 * @param user
 * @param until
 *
 * @returns {*}
 */
function calculateCarryData(user, until) {
    const sql = 'SELECT * FROM user_calculate_carry_time($1, $2::DATE)';
    return query(sql, [user.usr_id, until])
        .then((result) => {
            const carryData = {
                carryTime: { hours: 0, minutes: 0 },
                carryFrom: null,
                carryTo: null,
            };

            if (result.rowCount <= 0) {
                return carryData;
            }

            const data = result.rows[0];
            if (data.uw_carry_time !== null) {
                carryData.carryTime = data.uw_carry_time;
                carryData.carryFrom = data.uw_date_from;
                carryData.carryTo = data.uw_due_date;
            }

            return carryData;
        });
}

function fetchHolidays(userId, dateRange) {
    const holidayQuery = db.days
        .select(db.days.star(), db.periods.star())
        .from(db.days
            .join(db.periods)
            .on(db.periods.per_day_id.equals(db.days.day_id))
            .join(db.periodTypes)
            .on(db.periods.per_pty_id.equals(db.periodTypes.pty_id))
            .join(db.users)
            .on(db.days.day_usr_id.equals(db.users.usr_id)))
        .where(db.users.usr_id.equals(userId))
        .and(db.periodTypes.pty_name.equals('Feiertag'))
        .and(db.days.day_date.between(dateRange.start, dateRange.end))
        .toQuery();
    return query(holidayQuery).then(_.property('rows'));
}

function fetchHolidayPeriodTypeId() {
    const periodTypeQuery = db.periodTypes
        .select(db.periodTypes.pty_id)
        .from(db.periodTypes)
        .where(db.periodTypes.pty_name.equals('Feiertag'))
        .toQuery();
    return query(periodTypeQuery)
        .then(result => result.rows[0].pty_id);
}

function fetchPeriodTypes() {
    const periodTypeQuery = db.periodTypes
        .select(db.periodTypes.star())
        .from(db.periodTypes)
        .toQuery();
    return query(periodTypeQuery)
        .then(_.property('rows'));
}

function createMissingHolidays(dateRange, user, start, existingHolidays, holidayPeriodTypeId) {
    const employmentEnd = moment(user.usr_employment_end);

    const expectedHolidays = util.getHolidaysForDateRange(dateRange);
    const newHolidays = expectedHolidays
        // omit all holidays that are in the database already
        .filter(({ date }) => !existingHolidays.some(holiday => moment(holiday.day_date).format('YYYY-MM-DD') === date))
        // omit all holidays that are not within employment
        .filter(({ date }) => {
            const day = moment(date);
            return !(day.isBefore(start) || day.isAfter(employmentEnd));
        });

    // eslint-disable-next-line new-cap
    const newPeriodPromises = _.map(newHolidays, ({ comment, date }) => Q.Promise((resolve) => {
        const mDate = moment(date, 'YYYY-MM-DD').toDate();
        // get user target time for that specific date (handles weekends correct)
        User.getTargetTime(user.usr_id, mDate, (val) => {
            const duration = moment.duration(val);
            const newPeriod = {
                date: mDate,
                userId: user.usr_id,
                per_duration: duration.format('hh:mm'),
                per_comment: comment,
                per_pty_id: holidayPeriodTypeId,
            };

            period.post(newPeriod.userId, newPeriod, resolve);
        });
    }));

    return Q.all(newPeriodPromises);
}

function getTimesheetForTimeRange(user, dateRange) {
    const userId = user.usr_id;
    // don't start with range start, but 1 day before for carry data calculation
    const carryStart = moment(dateRange.start);
    carryStart.subtract(1, 'days');

    const carryDataPromise = calculateCarryData(user, carryStart.toDate());

    // fetch existing holidays within dateRange
    const holidayPromise = fetchHolidays(userId, dateRange);

    // fetch holiday period type
    const periodTypePromise = fetchHolidayPeriodTypeId();

    // fetch period types
    const periodTypesPromise = fetchPeriodTypes();

    // get start for user
    const userStartPromise = User.getStartDate(userId);

    return Q.all([holidayPromise, periodTypePromise, periodTypesPromise, userStartPromise])
        .spread(
            (existingHolidays, holidayPeriodTypeId, periodTypes, userStart) => [
                createMissingHolidays(dateRange, user, userStart, existingHolidays, holidayPeriodTypeId),
                periodTypes,
            ])
        .spread(
            (createdHolidays, periodTypes) => Q.all([
                fetchPeriodsGroupedByDay(userId, dateRange, periodTypes),
                carryDataPromise,
            ])
        )
        .spread((timesheet, carryData) => {
            return {
                ...timesheet,
                carryTime: carryData.carryTime,
                // debug information, so we know in which timeframe the carryTime was calculated
                carryFrom: carryData.carryFrom,
                carryTo: carryData.carryTo,
            };
        });
}

module.exports = {
    get(userId, fromDate, toDate) {
        const dateRange = {
            start: fromDate,
            end: toDate,
        };
        return User.get(userId)
            .then(
                (user) => getTimesheetForTimeRange(user, dateRange),
                err => Error(err)
            );
    },
};
