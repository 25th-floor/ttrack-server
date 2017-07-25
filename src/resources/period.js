require('moment-duration-format');
const Q = require('q');
const moment = require('moment');
const _ = require('lodash');
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
function fetchDayIdForUser(date, user, target) {
    return query('SELECT day_id FROM days WHERE day_date = $1 AND day_usr_id = $2', [date, user.usr_id])
        .then((result) => {
            if (result.rows.length) {
                return result.rows[0].day_id;
            }

            const queryString = 'INSERT INTO days VALUES (default, $1, $2, $3) RETURNING day_id';
            return query( queryString, [date, user.usr_id, target])
                .then(res => res.rows[0].day_id);
        });
}

function fetchPeriodTypes() {
    return query('SElECT * FROM period_types').then((result) => {
        //TODO what?
        const map = {};
        result.rows.forEach((row) => {
            map[row.pty_name] = row.pty_id;
        });
        return map;
    });
}

function convertToTime(time) {
    return time ? moment.duration(time).format('hh:mm:', { trim: false }) : null;
}

function preparePeriodForApiResponse(periodData) {
    return _.mapValues(periodData, (val, key) => {
        // transform time strings
        if (_.includes(['per_start', 'per_stop'], key)) {
            if (val === null) return null;
            const duration = moment.duration(val);
            return {
                hours: duration.get('hours') + (duration.get('days') * 24),
                minutes: duration.get('minutes'),
            };
        }
        return val;
    });
}

module.exports = {
    post(userId, postData) {
        const userPromise = User.get(userId);
        const targetPromise = User.getTargetTime(userId, postData.date);

        return Q.all([userPromise, targetPromise])
            .spread((user, target) => {
                return Q.all([
                    fetchPeriodTypes(),
                    fetchDayIdForUser(postData.date, user, target),
                ]).spread((types, dayId) => {
                    const data = postData;
                    // TODO: check if pty_id is valid type if defined
                    if (data.per_pty_id === undefined) {
                        data.per_pty_id = types.Arbeitszeit;
                    }

                    if (data.per_start) {
                        data.per_stop = data.per_stop ? convertToTime(data.per_stop) : null;
                        data.per_start = convertToTime(data.per_start);
                        data.per_break = convertToTime(data.per_break);
                        return query(
                            'INSERT INTO periods (per_start, per_stop, per_break, per_comment, per_day_id, per_pty_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                            [data.per_start, data.per_stop, data.per_break, data.per_comment, dayId, data.per_pty_id]);
                    }

                    data.per_duration = convertToTime(data.per_duration);
                    return query(
                        'INSERT INTO periods (per_duration, per_comment, per_day_id, per_pty_id) VALUES ($1, $2, $3, $4) RETURNING *',
                        [data.per_duration, data.per_comment, dayId, data.per_pty_id]);
                })
                    .then((result) => preparePeriodForApiResponse(result.rows[0])) ;

            });
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
                    return query(
                        'UPDATE periods SET per_start = $1, per_stop = $2, per_break = $3, per_duration = NULL, per_comment = $4, per_pty_id = $5 WHERE per_id = $6 RETURNING *',
                        [data.per_start, data.per_stop, data.per_break, data.per_comment, data.per_pty_id, data.per_id]);
                }

                data.per_duration = convertToTime(data.per_duration);
                return query(
                    'UPDATE periods SET per_duration = $1, per_comment = $2, per_pty_id = $3, per_start = NULL, per_stop = NULL, per_break = NULL WHERE per_id = $4 RETURNING *',
                    [data.per_duration, data.per_comment, data.per_pty_id, data.per_id]);
            })
            .then((result) => preparePeriodForApiResponse(result.rows[0]));
    },
    //TODO uniq parameter wording 
    delete(per_id, userId) {
        const sql = 'DELETE FROM periods WHERE per_id = (SELECT per_id FROM periods INNER JOIN days ON (day_id = per_day_id) WHERE per_id = $1 AND day_usr_id = $2)';
        return query(sql, [per_id, userId])
            .then(
                result => result,
                err => Error('error running select query', err)
            );
    },
    preparePeriodForApiResponse,
};
