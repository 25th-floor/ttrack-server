// const User = require('../../resources/user');
const R = require('ramda')
    , Boom = require('boom')
    , PeriodResources = require('../../resources/period');

const { 
    PostPeriod, 
    Period,
    UserId,
    PeriodId 
} = require('../schema');

module.exports.create = {
    tags: ['api'],
    id: 'createPeriod',
    description: 'Create a Period',
    notes: 'Create a Period',
    plugins: {
        'hapi-swagger': {
            responses: {
                '201': {
                    description: 'The Period has been created',
                    schema: Period
                },
                '400':{
                    description: 'Bad Request',
                }
            },
        },
    },
    validate: {
        payload: PostPeriod
            .options({ allowUnknown: true }),
        params: {
            userId: UserId.required(),
        }
    },
    handler: function (request, reply){
        const data = request.payload;
        const { userId } = request.params;
        request.server.log(['Info'],[`API POST Request for Period for user ${userId}`,data]);
        return PeriodResources
            .post(userId, { ...data, userId })
            .then(period => reply(period).code(201));
    }
};

module.exports.update = {
    tags: ['api'],
    notes: 'Update a Period',
    description: 'Updates a Period',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    description: 'The Period has been updated',
                    schema: Period
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
        payload: PostPeriod
            .options({ allowUnknown: true }),
        params:{
            userId: UserId.required(),
            per_id: PeriodId.required(),
        }
    },
    handler: async function (request, reply){
        const data = request.payload;
        const { userId, per_id } = request.params;
        request.server.log(['Info',[`API PUT Request for Period ${per_id} for user ${userId}`,data]]);
        // validate if user has this period
        const period = await PeriodResources.get(per_id, userId);
        if (!period || R.isEmpty(period)) {
            return reply(Boom.create(404, `Could not find period with id '${per_id}'`));
        }

        return PeriodResources
            .put(userId, { ...data, userId, per_id })
            .then(period => reply(period));
    }
};

module.exports.delete = {
    tags: ['api'],
    notes: 'Delete a Period',
    description: 'Deletes a Period',
    plugins: {
        'hapi-swagger': {
            responses: {
                '204': {
                    description: 'The Period has been deleted',
                },
                '404':{
                    description: 'Not Found',
                }
            },
        },
    },
    validate: {
        params:{
            userId: UserId.required(),
            per_id: PeriodId.required(),
        }
    },
    handler: function (request, reply){
        const { userId, per_id } = request.params;
        request.server.log(['Info'],[` API PUT DELETE for Period ${per_id} for user ${userId}`]);
        return PeriodResources
            .delete(per_id, userId)
            .then(
                () => reply().code(204)
            );
    }
};