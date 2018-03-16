const moment = require('moment');
module.exports = (joi) => ({
    name: 'duration',
    base: joi.string(),
    language: {
        maxYears: `Duration of Years should respect the maximal value of {{q}}`,
        maxDays: `Duration of Days should respect the maximal value of {{q}}'`,
        maxHours: `Duration of Hours should respect the maximal value of {{q}}'`,
        maxMinutes: `Duration of Minutes should respect the maximal value of {{q}}'`,

        minYears: `Duration of Years should respect the minimal value of {{q}}`,
        minDays: `Duration of Days should respect the minimal value of {{q}}'`,
        minHours: `Duration of Hours should respect the minimal value of {{q}}'`,
        minMinutes: `Duration of Minutes should respect the minimal value of {{q}}'`,
    },
    rules: [
        {
            name: 'maxHours',
            params: {
                maxHours: joi.number()
            },
            setup({maxHours}) {
                this._flags.maxHours = maxHours;
            },
            validate({maxHours}, value, state, options) {
                const exp = moment.duration(value).asHours() <= maxHours;
                if(exp) return value;
                return this.createError('duration.maxHours', { v: value, q: maxHours}, state, options);
            }
        },
        {
            name: 'maxMinutes',
            params: {
                maxMinutes: joi.number()
            },
            setup(params) {
                this._flags.maxMinutes = params.maxMinutes;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asMinutes() <= params.maxMinutes;
                if(exp) return value;
                return this.createError('duration.maxMinutes', { v: value, q: params.maxMinutes}, state, options);
            }
        },{
            name: 'maxDays',
            params: {
                maxDays: joi.number()
            },
            setup(params) {
                this._flags.maxDays = params.maxDays;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asDays() <= params.maxDays;
                if(exp) return value;
                return this.createError('duration.maxDays', { v: value, q: params.maxDays}, state, options);
            }
        },{
            name: 'maxYears',
            params: {
                maxYears: joi.number()
            },
            setup(params) {
                this._flags.maxYears = params.maxYears;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asYears() <= params.maxYears;
                if(exp) return value;
                return this.createError('duration.maxYears', { v: value, q: params.maxYears}, state, options);
            }
        },{
            name: 'minHours',
            params: {
                minHours: joi.number()
            },
            setup(params) {
                this._flags.minHours = params.minHours;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asHours() >= params.minHours;
                if(exp) return value;
                return this.createError('duration.minHours', { v: value, q: params.minHours}, state, options);
            }
        },{
            name: 'minMinutes',
            params: {
                minMinutes: joi.number()
            },
            setup(params) {
                this._flags.minMinutes = params.minMinutes;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asMinutes() >= params.minMinutes;
                if(exp) return value;
                return this.createError('duration.minMinutes', { v: value, q: params.minMinutes}, state, options);
            }
        },{
            name: 'minMinutes',
            params: {
                minMinutes: joi.number()
            },
            setup(params) {
                this._flags.minMinutes = params.minMinutes;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asMinutes() >= params.minMinutes;
                if(exp) return value;
                return this.createError('duration.minMinutes', { v: value, q: params.minMinutes}, state, options);
            }
        },{
            name: 'minYears',
            params: {
                minYears: joi.number()
            },
            setup(params) {
                this._flags.minYears = params.minYears;
            },
            validate(params, value, state, options) {
                const exp = moment.duration(value).asYears() >= params.minYears;
                if(exp) return value;
                return this.createError('duration.minYears', { v: value, q: params.minYears}, state, options);
            }
        },
    ]
});