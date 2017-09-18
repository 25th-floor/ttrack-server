// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , User = require('../../resources/user');

const Joi = BaseJoi.extend(Extension);


module.exports.list = {
    handler: function (request, reply) {
        return User.list()
            .then(
                success => reply(success),
            );
    },
    id: 'UserList'
};

module.exports.findById = {
    validate: {
        params: {
            id: Joi.number().integer().required(),
        }
    },
    handler: function (request, reply) {
        return User.get(request.params.id)
            .then(
                success => reply(success),
            );
    }
};
