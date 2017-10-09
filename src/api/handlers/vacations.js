const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');
const R = require('ramda');
const { query } = require('../../pg');

const Joi = BaseJoi.extend(Extension);

const {
    Vacancy,
} = require('../schema');

const ListMeta = Joi.object({
    "total": Joi.number().example('123'),
    "limit": Joi.number().example('10'),
    "start": Joi.number().example('0'),
    "count": Joi.number().example('100'),
});

const listTotal = async () => {
    const sql = 'SELECT count(*) as count FROM ttrack_get_all_vacations()';
    const { rows } = await query(sql);
    const count = (R.head(rows) || {}).count || 0;
    return parseInt(count, 10);
};

const list = async (start, limit) => {
    const sql = 'SELECT * FROM ttrack_get_all_vacations() LIMIT $1 OFFSET $2';
    const { rows } = await query(sql, [limit, start]);
    return rows;
};

module.exports.list = {
    id: 'VacationList',
    tags: ['api'],
    description: 'fetches list of vacations',
    notes:'Fetches a list of all vacations',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    description: "list of vacations",
                    schema: Joi.object({
                        "_meta": ListMeta,
                        "vacations": Joi.array().items(Vacancy).label('Vacations'),
                    })
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
        query: {
            limit: Joi.number().integer().min(1).max(100).default(100),
            start: Joi.number().integer().min(0).default(0),
        }
    },
    handler: async function (request, reply) {
        const total = await listTotal();
        let { start, limit } = request.query;
        if (start > total) start = total;
        if (limit > total) limit = total;
        const success = await list(start, limit);
        reply({
            _meta: {
                total,
                limit,
                start,
                count: success.length,
            },
            vacations: success
        });
    },
};
