const moment = require('moment');
const R = require('ramda');
const { query } = require('../pg');

module.exports = {
    async list() {
        const today = moment();
        const sql = 'SELECT * FROM users WHERE (usr_employment_start IS NULL OR usr_employment_start <= $1) AND (usr_employment_end IS NULL OR usr_employment_end >= $1)';
        const { rows } = await query(sql, [today.format('YYYY-MM-DD')]);
        return rows;
    },
    async get(userId) {
        const sql = 'SELECT * FROM users WHERE usr_id = $1';
        const { rows } =  await query(sql, [userId]);
        return R.head(rows);
    },
    // get Users TargetTime for a specific date from the database
    async getTargetTime(userId, date) {
        const sql = 'SELECT * FROM user_get_target_time($1, $2::DATE)';
        const { rows } = await query(sql, [userId, date]);
        return R.head(rows).user_get_target_time;
    },
    // get Users TargetTime for a specific date from the database
    async getStartDate(userId) {
        const sql = 'SELECT * FROM user_get_start_date($1)';
        const { rows } = await query(sql, [userId]);
        return R.compose(
            moment,
            R.prop('user_get_start_date'),
            R.head,
        )(rows);
    },
};
