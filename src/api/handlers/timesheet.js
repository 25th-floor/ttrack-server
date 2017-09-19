// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
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
        params: {
            userId: UserId.required(),
            from: Joi.date()
                .format('YYYY-MM-DD')
                .description('startpoint of the timesheet')
                .example('2017-05-01')
                .required(),
            to: Joi.date()
                .description('endpoint of the timesheet')
                .example('2017-05-01')
                .format('YYYY-MM-DD')
                .required(), 
        }
    },
    handler: function (request, reply){
        const { userId, from ,to } = request.params;
        return TimesheetResources.get(userId, from, to)
            .then(
                (timesheet) => reply(timesheet)
            );
    }
};
