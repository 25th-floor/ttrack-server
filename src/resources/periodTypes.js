const db = require('../db');
const { query} = require('../pg');

module.exports = {
    list() {
        return query('SELECT * FROM period_types');
    },
};
