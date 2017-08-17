const moment = require('moment')
    , { query} = require('../pg');

module.exports = {
    list() {
        const sql = 'SELECT * FROM users WHERE usr_employment_start IS NULL OR usr_employment_end IS NULL';
        return query(sql)
            .then(
                result => result.rows,
                err => Error('error running select query', err)
            );
    },
    get(userId) {
        const sql = 'SELECT * FROM users WHERE usr_id = $1';
        return query(sql, [userId])
            .then(
                result => result.rows[0],
                err => Error('error running select query', err)
            );
    },
    // get Users TargetTime for a specific date from the database
    getTargetTime(userId, date) {
        const sql = 'SELECT * FROM user_get_target_time($1, $2::DATE)';
        return query(sql, [userId, date])
            .then(
                result => result.rows[0].user_get_target_time,
                err => Error('error running select query', err)
            );
    },
    // get Users TargetTime for a specific date from the database
    getStartDate(userId) {
        const sql = 'SELECT * FROM user_get_start_date($1)';
        return query(sql, [userId])
            .then(
                result => moment(result.rows[0].user_get_start_date),
                err => Error('error running select query', err)
            );
    },
};
