// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , User = require('../../resources/user')
    , Timesheet = require('../../resources/timesheet')
    , Period = require('../../resources/period');

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

module.exports.timesheetFromToById = {
    validate: {
        params: {
            userId: Joi.number().integer().required(),
            from: Joi.date().format('YYYY-MM-DD').required(),
            to: Joi.date().format('YYYY-MM-DD').required(), 
        }
    },
    handler: function (request, reply){
        const { userId, from ,to } = request.params;
        return Timesheet.get(userId, from, to)
            .then(
                (timesheet) => reply(timesheet),
                error
            );
    }
};

module.exports.createPeriod = {
    id: 'createPeriod',
    validate: {
        payload: Joi.object({
            date: Joi.date().format('YYYY-MM-D').required(),
            per_pty_id: Joi.string().required(),
            //per_duration: Joi.number().integer().required(),
            per_start: Joi.string().required(),
            per_stop: Joi.string(),
            per_break: Joi.string(),
            per_comment: Joi.string(),
        }),
        params:{
            userId: Joi.number().required(),
        }
    },
    handler: function (request, reply){
        const data = request.payload;
        const { userId } = request.params;
        console.info('API POST Request for Period for user', userId);
        return Period
            .post(userId, { ...data, userId })
            .then(period => reply(period));
    }
};

module.exports.updatePeriod = {
    validate: {
        payload: Joi.object({
            date: Joi.date().format('YYYY-MM-DD').required(),
            per_pty_id: Joi.string().required(),
            per_start: Joi.string().required(),
            per_stop: Joi.string(),
            per_break: Joi.string(),
            per_comment: Joi.string(),
        }),
        params:{
            userId:  Joi.number().integer().required(),
            per_id:  Joi.number().integer().required(),
        }
    },
    handler: function (request, reply){
        const data = request.payload;
        const { userId, per_id } = request.params;
        console.info(` API PUT Request for Period ${per_id} for user ${userId}`);
        return Period
            .put(userId, { ...data, userId, per_id })
            .then(period => reply(period).code(201));
    }
};

module.exports.deletePeriod = {
    validate: {
        params:{
            userId:  Joi.number().integer().required(),
            per_id:  Joi.number().integer().required(),
        }
    },
    handler: function (request, reply){
        const { userId, per_id } = request.params;
        console.info(` API PUT DELETE for Period ${per_id} for user ${userId}`);
        return Period
            .delete(per_id, userId)
            .then(
                () => reply(),
                error => console.error(error)
            );
    }
};