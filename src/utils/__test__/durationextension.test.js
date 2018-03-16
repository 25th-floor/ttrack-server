const BaseJoi = require('joi');
const DurationExtension = require('../durationextension');
const Joi = BaseJoi.extend(DurationExtension);

describe('Duration extension',()=>{
    it('should faile if max hours is not valid',() => {
        const durationString = "PT222H";
        const duration = Joi.duration().maxHours(22);
        const v = Joi.validate(durationString,duration);
        expect( 
            v.error.toString() 
        ).toEqual("ValidationError: \"value\" Duration of Hours should respect the maximal value of 22'");
        expect(v.value).toBe(durationString)
    });
});