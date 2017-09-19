// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , UserResources = require('../../resources/user');

const Joi = BaseJoi.extend(Extension);

const { 
    User,
    UserId,
} = require('../schema');

module.exports.list = {
    id: 'UserList',
    tags: ['api'],
    description: 'fetches list of users',
    notes:'Fetches a list of all users that are currently available',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    'description': "list of users",
                    schema:  Joi.array()
                        .items(User).label('Users')
                },
                '400':{
                    description: 'Bad Request',
                },
                '404':{
                    description: 'Not Found',
                }
            },
        },
    },
    handler: function (request, reply) {
        return UserResources.list()
            .then(
                success => reply(success),
            );
    },
};

module.exports.findById = {
    tags: ['api'],
    description: 'Find a user by id',
    notes: 'Returns a user with the given id',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    description: 'The user with the corresponding id',
                    schema: User
                },
                '400':{
                    description: 'Bad Request',
                },
                '404':{
                    description: 'Not Found',
                }
            },
        },
    },
    validate: {
        params: {
            id: UserId.required()
        }
    },
    handler: function (request, reply) {
        return UserResources.get(request.params.id)
            .then(
                success => reply(success),
            );
    }
};
