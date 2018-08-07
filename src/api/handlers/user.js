const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , Boom = require('boom')
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
                    description: "list of users",
                    schema: Joi.array()
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
    handler: async function (request) {
        const list = await UserResources.list();
        return list;
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
    handler: async function (request) {
        const success = await UserResources.get(request.params.id);
        if(success) return success;
        return Boom.create(404, `Could not find user with id ${request.params.id}'`);
    }
};
