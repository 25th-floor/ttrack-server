const moment = require('moment');
const Q = require('q');
const R = require('ramda');
const holidayUtils = require('../utils/holidayUtils');
const period = require('./period');
const User = require('./user');
const { query } = require('../pg');
const { getValidDateRange } = require('../utils/dateUtils');

function fmtDayDate(row) {
    return moment(row.day_date).format('YYYY-MM-DD');
}

function hasKeyPrefix(prefix) {
    return (value, key) => R.startsWith(prefix, key);
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
    return query(periodQuery, [userId, dateRange.start, dateRange.end])
        .then((result) => {
            const grouped = R.groupBy(fmtDayDate, result.rows);
            const data = R.map((periods) => {
                // pick day fields from first period in list to get all props for the day
                const day = R.pickBy(hasKeyPrefix('day_'), R.head(periods));

                function transformPeriod(d) {
                    // only pick props that *do not* have a "day_" prefix
                    const periodData = R.pickBy(R.pipe(hasKeyPrefix('day_'), R.not), d);
                    return period.preparePeriodForApiResponse(periodData);
                }

                // filter empty periods
                const p = periods.map(transformPeriod).filter(pe => pe.per_id !== null);

                function calculateRemaining() {
                    const duration = periods.reduce(
                        (res, per) => {
                            // map period type to period
                            const type = R.find(t => t.pty_id === per.per_pty_id, periodTypes);

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
            }, grouped);
            return {
                days: R.sortBy(day => moment(day.day_date), R.values(data)), // todo should not the database do this?
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
    const sql = 'SELECT * FROM user_calculate_carry_time($1, $2)';
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
    return query(holidayQuery,[userId, 'Feiertag', dateRange.start, dateRange.end ]).then(R.prop('rows'));
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

async function fetchPeriodTypes() {
    const periodTypeQuery = 'SELECT * FROM period_types';
    const result = await query(periodTypeQuery);
    return result.rows;
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
 * @param {array(object)} existingHolidays Contains periods
 * @param {string} holidayPeriodTypeId contains the type of period
 */
async function createMissingHolidays(dateRange, user, existingHolidays, holidayPeriodTypeId) {
    const expectedHolidays = holidayUtils.getHolidaysForDateRange(dateRange);

    const omitCreatedHolidays = R.filter(
        ({ date }) => !existingHolidays.some(holiday => moment(holiday.day_date).format('YYYY-MM-DD') === date)
    );

    const newHolidays = R.compose(
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
    const existingHolidays = await fetchHolidays(userId, dateRange);
    const holidayPeriodTypeId = await fetchHolidayPeriodTypeId();

    const createdHolidays = await createMissingHolidays(dateRange, user, existingHolidays, holidayPeriodTypeId);
    return createdHolidays;
}

/**
 * Returns Timesheet for user and create missing holidays
 * @param {object} user db_user
 * @param {object} dateRange 
 */
async function getTimesheetForTimeRange(user, dateRange) {
    const userId = user.usr_id;

    const startDate = await User.getStartDate(userId);
    const validDateRange = getValidDateRange(startDate, user.usr_employment_end, dateRange);
    if (validDateRange === null) {
        return false;
    }

    // don't start with range start, but 1 day before for carry data calculation
    const carryStart = moment(validDateRange.start); //? dateRange
    carryStart.subtract(1, 'days'); //? validDateRange

    // CREATE HOLIDAYS
    await holidayControlFlow(user, validDateRange);

    const carryData = await calculateCarryData(user, carryStart.toDate());
    const periodTypes = await fetchPeriodTypes();
    const timesheet = await fetchPeriodsGroupedByDay(userId, validDateRange, periodTypes);

    return {
        ...timesheet,
        ...carryData,
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
