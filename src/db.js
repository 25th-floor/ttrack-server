const Q = require('q');
const sql = require('sql');

const periods = sql.define({
    name: 'periods',
    columns: ['per_id', 'per_start', 'per_stop', 'per_break', 'per_duration', 'per_pty_id', 'per_day_id', 'per_comment'],
});

const days = sql.define({
    name: 'days',
    columns: ['day_id', 'day_date', 'day_comment', 'day_usr_id', 'day_target_time'],
});

const users = sql.define({
    name: 'users',
    columns: ['usr_id', 'usr_firstname', 'usr_lastname', 'usr_email', 'usr_employment_start', 'usr_employment_end'],
});

const userTargetTimes = sql.define({
    name: 'user_target_times',
    columns: ['utt_usr_id', 'utt_start', 'utt_end', 'utt_target_time'],
});

const periodTypes = sql.define({
    name: 'period_types',
    columns: ['pty_id', 'pty_name'],
});

/**
 * simple wrapper for db query that returns a promise
 *
 * @param db the db object
 * @param q the query object or string
 * @param vals the query values if no query object is provided, optional, defaults to empty array
 * @returns {*} promise
 */
function query(db, q /* , vals */) {
    // eslint-disable-next-line prefer-rest-params
    const vals = q.values || (arguments.length > 2 ? arguments[2] : []);
    const sqlQuery = q.text || q;
    // eslint-disable-next-line new-cap
    return Q.Promise((resolve, reject) => {
        db.query(sqlQuery, vals, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports = {
    periods,
    days,
    users,
    userTargetTimes,
    periodTypes,
    query,
};
