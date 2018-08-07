const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');

const appRoot = require('app-root-path');
const {
    version, 
    ttrackServer: {
        apiVersion = 1,
        validVersions = [1],
    } 
} = require(`${appRoot}/package.json`);

const Joi = BaseJoi.extend(Extension);

let buildInfo;
try {
    buildInfo = require(`${appRoot}/buildinfo.json`);
} catch (e) {
    buildInfo = {};
}

module.exports.list = {
    id: 'Home',
    tags: ['api'],
    description: 'returns version of the api',
    notes:'Returns all versioning information',
    plugins: {
        'hapi-swagger': {
            responses: {
                '200': {
                    description: "Home",
                    schema: Joi.object({
                        "apiVersion": Joi.number().example(1),
                        "buildNumber": Joi.number().example(42),
                        "validVersions": Joi.array().items(Joi.number()).example([1,2]),
                        "git": Joi.string().example('964aa95'),
                        "version": Joi.string().example('1.2.3'),
                    }),
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
    handler: () => ({
        ...buildInfo,
        apiVersion,
        validVersions,
        version,
    }),
};
