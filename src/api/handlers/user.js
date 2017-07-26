// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , User = require('../../resources/user');

const Joi = BaseJoi.extend(Extension);

const error = (error) => console.log('error', error);

module.exports.list = {
    handler: function (request, reply) {
        return User.list()
            .then(
                success => reply(success),
                error
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
                error
            );
    }
};
