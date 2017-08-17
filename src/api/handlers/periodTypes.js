const Period = require('../../resources/periodTypes');

module.exports.list = {
    handler: function (request, reply) {
        return Period.list()
            .then(
                success => reply(success.rows),
                error => console.error(error)
            );
    }
};