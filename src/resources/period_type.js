const db = require('../db');

module.exports = {
    list(pg, cb) {
        pg((client) => {
            const query = db.periodTypes.select(db.periodTypes.star())
                .from(db.periodTypes).toQuery();
            db.query(client, query).then((result) => {
                cb(result.rows);
            }).done();
        });
    },
};
