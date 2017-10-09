const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);

const DateTime = Joi.alternatives().try(
    Joi.object({
        "hours": Joi.number().example('12'),
        "minutes": Joi.number().example('33'),
    }),
    Joi.string().example('PT8H').description('moment interval')
);

module.exports.DateTime = DateTime;

const UserId =  Joi
    .number()
    .integer()
    .description('id of user')
    .label('user id');
module.exports.UserId = UserId;

const User = Joi.object({
    "id": UserId.required(),
    "firstname": Joi.string().example('jack').required(),
    "lastname": Joi.string().example('Bauer').required(),
    "email": Joi.string().example('foo@bar.com').required(),
    "employmentStart": Joi.string().example('2016-08-29T09:12:33.001Z').required(),
    "employmentEnd": Joi.string().example('2016-08-29T09:12:33.001Z').required(),
}).label('User');
module.exports.User = User;

const PeriodInputTypes = Joi.object({
    "period": Joi.boolean().description('period type input is allowed'),
    "fullday": Joi.boolean().description('full day input type is allowed'),
    "halfday": Joi.boolean().description('half day input type is allowed'),
    "duration": Joi.boolean().description('duration input type is allowed'),
}).label('PeriodInputTypes');
module.exports.PeriodInputTypes = PeriodInputTypes;

const PeriodTypeConfig = Joi.object({
    "icon": Joi.string().example('fa-comment').description('font-awesome icon'),
    "color": Joi.string().example('white').description('css color'),
    "bgcolor": Joi.string().example('#656D78').description('css background color'),
    "nobadge": Joi.boolean().example(true).description('hide badge'),
    "types": PeriodInputTypes.required(),
}).label('PeriodTypeConfig');
module.exports.PeriodTypeConfig = PeriodTypeConfig;

const PeriodType = Joi.object({
    "pty_id": Joi.string().example('work'),
    "pty_name": Joi.string().example('Arbeitszeit'),
    "pty_config": PeriodTypeConfig,
}).label('PeriodType');
module.exports.PeriodType = PeriodType;

const PeriodId = Joi.number().integer().example('123').description('Id of Period');
module.exports.PeriodId = PeriodId;

const Period = Joi.object({
    "per_id": PeriodId,
    "pty_name": Joi.string().example('Feiertag').description('The name of the PeriodType'),
    "per_comment":Joi.string().example('My awesome comment for the day').description('a comment field for the user to add comments to a period'),
    "per_day_id":Joi.number().example('123'),
    "per_pty_id":Joi.string().example('123').description('PeriodType Id'),
    "per_start": DateTime,
    "per_break":DateTime,
    "per_stop": DateTime,
    "per_duration": DateTime,
});
module.exports.Period = Period;

const Day = Joi.object({
    "day_id": Joi.number().example('123'),
    "day_date": Joi.string().example('2016-08-29T00:00:00.000Z'),
    "day_usr_id": Joi.number().example(32).description('id of the user'),
    "day_target_time": DateTime,
    "periods": Joi.array().items(Period),
    "remaining": DateTime,
});
module.exports.Day = Day;

const Timesheet = Joi.object({
    "carryFrom": Joi.string().example('2016-08-29T09:12:33.001Z').description('Date from which point in time the carry data has been calculated from'),
    "carryTo": Joi.string().example('2016-08-29T09:12:33.001Z').description('Date to which point in time the carry data has been calculated to'),
    "carryTime": DateTime,
    "days": Joi.array().items(Day),
});
module.exports.Timesheet = Timesheet;

const PostPeriod = Joi.object({
    // userId: UserId.required(),
    date: Joi.date().format('YYYY-MM-D').example('2017-05-1').required(),
    per_pty_id: Joi.string().required(),
    per_start: DateTime.required(),
    per_duration: DateTime,
    per_stop: DateTime,
    per_break: DateTime,
    type: PeriodType,
    duration: Joi.string().example('period'),
    per_comment: Joi
        .string()
        .example('My awesome comment for the day')
        .description("a comment field for the user to add comments to a period"),
}).label('Post Period');
module.exports.PostPeriod = PostPeriod;

const Vacancy = Joi.object({
    "day_id": Joi.number().example('123'),
    "day_date": Joi.string().example('2016-08-29T00:00:00.000Z'),
    "day_target_time": DateTime,
    "usr_id": Joi.number().example(32).description('id of the user'),
    "usr_firstname": Joi.string().example('jack').required(),
    "usr_lastname": Joi.string().example('Bauer').required(),
    "per_id": PeriodId,
    "per_comment":Joi.string().example('My awesome comment for the day').description('a comment field for the user to add comments to a period'),
    "per_duration": DateTime,
});
module.exports.Vacancy = Vacancy;
