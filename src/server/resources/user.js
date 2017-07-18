const moment = require('moment');

module.exports = {
    list(pg, cb) {
        pg((db) => {
            const query = 'SELECT * FROM users WHERE usr_employment_start IS NULL OR usr_employment_end IS NULL';
            db.query(query, (err, result) => {
                if (err) {
                    return console.error('error running select query', err);
                }
                cb(result.rows);
                return true;
            });
        });
    },
    get(pg, userId, cb) {
        pg((db) => {
            const query = 'SELECT * FROM users WHERE usr_id = $1';
            db.query(query, [userId], (err, result) => {
                if (err) {
                    return console.error('error running select query', err);
                }
                console.log(result.rows);
                cb(result.rows[0]);
                return true;
            });
        });
    },
    // get Users TargetTime for a specific date from the database
    getTargetTime(pg, userId, date, cb) {
        pg((db) => {
            const query = 'SELECT * FROM user_get_target_time($1, $2::DATE)';
            db.query(query, [userId, date], (err, result) => {
                if (err) {
                    return console.error('error running select query', err);
                }
                cb(result.rows[0].user_get_target_time);
                return true;
            });
        });
    },
    // get Users TargetTime for a specific date from the database
    getStartDate(pg, userId, cb) {
        pg((db) => {
            const query = 'SELECT * FROM user_get_start_date($1)';

            return db.query(query, [userId], (err, result) => {
                if (err) {
                    return console.error('error running select query', err);
                }
                const rows = result.rows;
                cb(moment(rows[0].user_get_start_date));
                return true;
            });
        });
    },
};
