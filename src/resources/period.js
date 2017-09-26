require('moment-duration-format');
const Q = require('q');
const moment = require('moment');
const R = require('ramda');
const User = require('./user');
const { query } = require('../pg');

/**
 * fetch day id for the specified date and user, creating the day if necessary
 *
 * @param db the db object
 * @param date the date, format YYYY-MM-DD
 * @param user the user
 * @param target the users target time for that day
 * @returns {*} promise
 */
async function fetchDayIdForUser(date, user, target) {
    let { rows } = await query('SELECT day_id FROM days WHERE day_date = $1 AND day_usr_id = $2', [date, user.usr_id]);
    if(R.head(rows)) return R.head(rows).day_id; 
 
    const newDay = await query('INSERT INTO days VALUES (default, $1, $2, $3) RETURNING day_id', [date, user.usr_id, target]);
    return R.head(newDay.rows).day_id;
}

async function fetchPeriodTypes() {
    const { rows } = await query('SElECT * FROM period_types');
    // creates from an array an object with obj.pty_name as key and obj.pty_id as value
    return  R.reduce((acc,obj) => ({
        ...acc,
        ...R.objOf(obj.pty_name)(obj.pty_id), //exp sick : 'krank'
    }),{},rows);
}

// TODO what das this ?
function convertToTime(time) {
    return time ? moment.duration(time).format('hh:mm:', { trim: false }) : null;
}
/**
 * Convert string(08:00)
 * @param {string} value
 * @returns {object} { hours:08, minutes: 00}
 */
const convertToTimeObject = (value) => {
    if(value === null) return value;
    const duration = moment.duration(value);
    return {
        hours: duration.get('hours') + (duration.get('days') * 24),
        minutes: duration.get('minutes'),
    };
};

/**
 * Mutate time string from periodData (per_start, per_stop) to DateTimeObject
 * @param {Object} periodData 
 */
function preparePeriodForApiResponse(periodData) {
    if(!periodData) return periodData;
    const containsKeys = R.allPass( [ R.hasIn('per_start'), R.hasIn('per_stop')] )(periodData);
    
    if (!containsKeys) return periodData;
    periodData.per_start = convertToTimeObject(periodData.per_start);
    periodData.per_stop = convertToTimeObject(periodData.per_stop);
    return periodData;
}

module.exports = {
    get(id, userId) {
        return query(`
            SELECT periods.*
            FROM periods
            JOIN days ON (per_day_id = day_id)
            WHERE per_id = $1
             AND day_usr_id = $2
        `,
            [id, userId]
        ).then(({rows}) => preparePeriodForApiResponse(R.head(rows)));
    },
    async post(userId, postData) {
        const user = await User.get(userId);
        const targetTime = await User.getTargetTime(userId, postData.date);
        const periodTypes = await fetchPeriodTypes();
        const dayId = await fetchDayIdForUser(postData.date, user, targetTime);
        
        const data = postData;
        // TODO: check if pty_id is valid type if defined 
        // TODO No test defined for these case
        if (data.per_pty_id === undefined) {
            data.per_pty_id = periodTypes.Arbeitszeit;
        }

        if (data.per_start) {
            data.per_stop = data.per_stop ? convertToTime(data.per_stop) : null;
            data.per_start = convertToTime(data.per_start);
            data.per_break = convertToTime(data.per_break);
            const sql = `
                INSERT INTO
                    periods (
                        per_start,
                        per_stop,
                        per_break,
                        per_comment,
                        per_day_id,
                        per_pty_id
                    )
                VALUES
                    ($1, $2, $3, $4, $5, $6) RETURNING *
            `;
            const newPeriod =  await query(sql,[
                data.per_start,
                data.per_stop,
                data.per_break,
                data.per_comment,
                dayId,
                data.per_pty_id
            ]);

            return preparePeriodForApiResponse(
                R.head(newPeriod.rows)
            );
        }

        data.per_duration = convertToTime(data.per_duration);
        const sql = `
            INSERT INTO
                periods (
                    per_duration,
                    per_comment,
                    per_day_id,
                    per_pty_id
                )
            VALUES
                ($1, $2, $3, $4) RETURNING *
        `;
        const {rows} = await query(sql,[
            data.per_duration,
            data.per_comment,
            dayId,
            data.per_pty_id]
        );

        return preparePeriodForApiResponse(R.head(rows));
    },
    put(userId, putData) {
        return Q.all([fetchPeriodTypes()])
            .spread((types) => {
                const data = putData;
                // TODO: check if pty_id is valid type if defined
                // TODO: check if userId is valid!
                if (data.pty_id === undefined) {
                    data.pty_id = types.Arbeitszeit;
                }

                if (data.per_start) {
                    data.per_stop = data.per_stop ? convertToTime(data.per_stop) : null;
                    data.per_start = convertToTime(data.per_start);
                    data.per_break = convertToTime(data.per_break);
                    return query(`
                        UPDATE
                            periods
                        SET
                            per_start = $1,
                            per_stop = $2,
                            per_break = $3,
                            per_duration = NULL,
                            per_comment = $4,
                            per_pty_id = $5
                        WHERE
                            per_id = $6 RETURNING *
                    `,
                        [data.per_start, data.per_stop, data.per_break, data.per_comment, data.per_pty_id, data.per_id]);
                }

                data.per_duration = convertToTime(data.per_duration);
                return query(`
                    UPDATE
                        periods
                    SET
                        per_duration = $1,
                        per_comment = $2,
                        per_pty_id = $3,
                        per_start = NULL,
                        per_stop = NULL,
                        per_break = NULL
                    WHERE
                        per_id = $4 RETURNING *
                `,
                    [data.per_duration, data.per_comment, data.per_pty_id, data.per_id]);
            })
            .then(({rows}) => preparePeriodForApiResponse(R.head(rows)));
    },
    //TODO uniq parameter wording 
    delete(per_id, userId) {
        const sql = `
            DELETE FROM
                periods
            WHERE
                per_id = (
                    SELECT
                        per_id
                    FROM
                        periods
                        INNER JOIN days ON (day_id = per_day_id)
                    WHERE
                        per_id = $1
                        AND day_usr_id = $2
                )
        `;

        return User.get(userId)
            .then(
                (success) => {
                    if(success) return query(sql, [per_id, userId]);
                    return success;
                }
            );
    },
    preparePeriodForApiResponse,
};
