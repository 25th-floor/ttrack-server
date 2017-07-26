// const User = require('../../resources/user');
const BaseJoi = require('joi')
    , Extension = require('joi-date-extensions')
    , Timesheet = require('../../resources/timesheet');

const Joi = BaseJoi.extend(Extension);

const error = (error) => console.log('error', error);

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
