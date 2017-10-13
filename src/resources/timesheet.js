const _ = require('lodash')
    , moment = require('moment')
    , Q = require('q')
    , R = require('ramda')
    , util = require('../common/util')
    , period = require('./period')
    , User = require('./user')
    , { query } = require('../pg');

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
                        "day_date": day.day_date.toISOString(),
                        periods: p,
                        // calculate remaining target time after reducing holidays and all other non Work durations
                        // todo: maybe this should be done in the database
                        remaining: calculateRemaining(),
                    }
                );
            });
            return {
                days: _.sortBy(_.values(data), day => moment(day.day_date)), // todo should not the database do this?
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
            // carryFrom/To are type Date
            if (data.uw_carry_time !== null) {
                carryData.carryTime = data.uw_carry_time;
                carryData.carryFrom = data.uw_date_from.toISOString();
                carryData.carryTo = data.uw_due_date.toISOString();
            }

            return carryData;
        });
}

function fetchHolidays(userId, dateRange) {
    const holidayQuery = `
    SELECT
        "days".*,
        "periods".*
    FROM
        "days"
    INNER JOIN "periods" ON ("periods"."per_day_id" = "days"."day_id")
    INNER JOIN "period_types" ON ("periods"."per_pty_id" = "period_types"."pty_id")
    INNER JOIN "users" ON ("days"."day_usr_id" = "users"."usr_id")
    WHERE
    (
        (
            ("users"."usr_id" = $1)
            AND ("period_types"."pty_name" = $2)
        )
        AND (
            "days"."day_date" BETWEEN $3 AND $4
        )
    )`;
    return query(holidayQuery,[userId, 'Feiertag', dateRange.start, dateRange.end ]).then(_.property('rows'));
}

function fetchHolidayPeriodTypeId() {
    const periodTypeQuery = `
        SELECT
            "period_types"."pty_id"
        FROM
            "period_types"
        WHERE
            ("period_types"."pty_name" = $1)
    `;
    return query(periodTypeQuery, ['Feiertag'])
        .then(result => result.rows[0].pty_id);
}

function fetchPeriodTypes() {
    const periodTypeQuery = 'SELECT * FROM period_types';
    return query(periodTypeQuery)
        .then(_.property('rows'));
}

async function createPeriod(user,holidayPeriodTypeId,{comment, date}){
    const mDate = moment(date, 'YYYY-MM-DD').toDate();
    const targetTime = await User.getTargetTime(user.usr_id, mDate);
    const duration = moment.duration(targetTime);
    const newPeriod = {
        date: mDate,
        userId: user.usr_id,
        per_duration: duration.format('hh:mm'),
        per_comment: comment,
        per_pty_id: holidayPeriodTypeId,
    };
    const posted = await period.post(newPeriod.userId, newPeriod);
    return posted;
}

/**
 * Create missing holidays in db
 * @param {object} dateRange 
 * @param {object} user 
 * @param {userStart} userStart 
 * @param {array(object)} existingHolidays Contains periods 
 * @param {string} holidayPeriodTypeId contains the type of period
 */
async function createMissingHolidays(dateRange, user, userStart, existingHolidays, holidayPeriodTypeId) {
    const employmentEnd = moment(user.usr_employment_end);
    const expectedHolidays = util.getHolidaysForDateRange(dateRange);

    const omitCreatedHolidays = R.filter(
        ({ date }) => !existingHolidays.some(holiday => moment(holiday.day_date).format('YYYY-MM-DD') === date)
    );

    const omitEmploymentEnd = R.filter(
        ({ date }) =>  !(moment(date).isBefore(userStart) || moment(date).isAfter(employmentEnd))
    );

    const newHolidays = R.compose(
        omitEmploymentEnd,
        omitCreatedHolidays,
    )(expectedHolidays);

    const createHolidayPeriod = R.curry(createPeriod)(user)(holidayPeriodTypeId);
    const newHolidayPeriods = R.map(createHolidayPeriod)(newHolidays);
    // newHolidayPeriods contains an arry of promises
    // to resolve promises in an array q.all is needed
    return Q.all(newHolidayPeriods);
}
/**
 * Returns new created holidays for user a
 * @param {object} user db_user
 * @param {object} dateRange 
 */
async function holidayControlFlow(user, dateRange){
    const userId = user.usr_id;
    const userStart = await User.getStartDate(userId);
    const existingHolidays = await fetchHolidays(userId, dateRange);
    const holidayPeriodTypeId = await fetchHolidayPeriodTypeId();

    const createdHolidays = await createMissingHolidays(dateRange, user, userStart, existingHolidays, holidayPeriodTypeId);
    return createdHolidays;
}

/**
 * Returns Timesheet for user and create missing holidays
 * @param {object} user db_user
 * @param {object} dateRange 
 */
async function getTimesheetForTimeRange(user, dateRange) {
    const userId = user.usr_id;
    // don't start with range start, but 1 day before for carry data calculation
    const carryStart = moment(dateRange.start);

    // if carryStart begins before the user started it's wrong
    if (carryStart.isBefore(moment(user.usr_employment_start))) {
        return false;
    }

    carryStart.subtract(1, 'days');

    // CREATE HOLIDAYS
    await holidayControlFlow(user, dateRange);

    const carryData = await calculateCarryData(user, carryStart.toDate());
    const periodTypes = await fetchPeriodTypes();
    const timesheet = await fetchPeriodsGroupedByDay(userId, dateRange, periodTypes);

    return {
        ...timesheet,
        carryTime: carryData.carryTime,
        // debug information, so we know in which timeframe the carryTime was calculated
        carryFrom: carryData.carryFrom,
        carryTo: carryData.carryTo,
    };
}

module.exports = {  
    holidayControlFlow,
    // HANDLER
    get(userId, fromDate, toDate) {
        const dateRange = {
            start: fromDate,
            end: toDate,
        };
        return User.get(userId)
            .then(
                (user) => {
                    if(user) return getTimesheetForTimeRange(user, dateRange);
                    return user;
                }
            );
    },
};
