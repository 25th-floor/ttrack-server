// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , R = require('ramda')
    , Boom = require('boom')
    , Period = require('../../resources/period');

const Joi = BaseJoi.extend(Extension);

module.exports.create = {
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
        }).options({ allowUnknown: true }),
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
            .then(period => reply(period).code(201));
    }
};

module.exports.update = {
    validate: {
        payload: Joi.object({
            date: Joi.date().format('YYYY-MM-DD').required(),
            per_pty_id: Joi.string().required(),
            per_start: Joi.string().required(),
            per_stop: Joi.string(),
            per_break: Joi.string(),
            per_comment: Joi.string(),
        }).options({ allowUnknown: true }),
        params:{
            userId:  Joi.number().integer().required(),
            per_id:  Joi.number().integer().required(),
        }
    },
    handler: async function (request, reply){
        const data = request.payload;
        const { userId, per_id } = request.params;
        console.info(` API PUT Request for Period ${per_id} for user ${userId}`);

        // validate if user has this period
        const period = await Period.get(per_id, userId);
        if (!period || R.isEmpty(period)) {
            return reply(Boom.create(404, `Could not find period with id '${per_id}'`));
        }

        return Period
            .put(userId, { ...data, userId, per_id })
            .then(period => reply(period));
    }
};

module.exports.delete = {
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
                () => reply().code(204),
            );
    }
};