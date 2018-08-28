const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , Boom = require('boom')
    , TimesheetResources = require('../../resources/timesheet');

const Joi = BaseJoi.extend(Extension);

const { UserId, Timesheet } = require('../schema');

module.exports.timesheetFromToById = {
    tags: ['api'],
    notes: 'Fetches the Timesheet',
    description: 'Fetches all days with periods between the given date range',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    description: 'The timesheet for a user in a given date range',
                    schema: Timesheet
                },
                '404':{
                    description: 'Not Found',
                }
                ,'400':{
                    description: 'Bad Request',
                }
            },
        },
    },
    validate: {
        params: Joi.object({
            userId: UserId.required(),
            from: Joi.date()
                .format('YYYY-MM-DD')
                .description('startpoint of the timesheet')
                .example('2017-05-01')
                .required(),
            to: Joi.date()
                .description('endpoint of the timesheet')
                .format('YYYY-MM-DD')
                .example('2017-05-01')
                .min(Joi.ref('from')) // It is important that .min is below example see https://github.com/hapijs/joi/issues/1186
                .required(), 
        }),
        // return validation error, which is disabled by default in hapi 17
        failAction: async (request, h, err) => {
            throw err;
        }
    },
    handler: async function (request){
        const { userId, from ,to } = request.params;
        const timesheet = await TimesheetResources.get(userId, from, to);
        if(timesheet) return timesheet;
        return new Boom(`Could not find timesheet for user ${userId}'`, { statusCode: 404 });
    }
};
