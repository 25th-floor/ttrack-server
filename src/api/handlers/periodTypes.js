const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    ,  Period = require('../../resources/periodTypes');

const Joi = BaseJoi.extend(Extension);
const { PeriodType } = require('../schema');

module.exports.list = {
    tags: ['api'],
    description: "fetches list of period types",
    notes: 'Fetches a list of all period types that are currently available',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    description: "list of period types",
                    schema: Joi.array().items(PeriodType)
                },
            },
        },
    },
    handler: function (request, reply) {
        return Period.list()
            .then(
                success => reply(success.rows),
            );
    }
};