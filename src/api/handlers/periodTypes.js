const Period = require('../../resources/periodTypes');
const error = (error) => console.log('error', error);

module.exports.list = {
    handler: function (request, reply) {
        return Period.list()
            .then(
                success => reply(success),
                error
            );
    }
};