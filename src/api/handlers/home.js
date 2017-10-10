const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');

const packageJson = require('../../../package.json');

const Joi = BaseJoi.extend(Extension);

let buildInfo;
try {
    buildInfo = require('../../../buildinfo.json');
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
                        "compatibleApiVersions": Joi.array().items(Joi.number()).example([1,2]),
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
    handler: async function (request, reply) {
        reply({
            ...buildInfo,
            apiVersion: packageJson.ttrackServer.apiVersion,
            compatibleApiVersions: packageJson.ttrackServer.compatibleApiVersions,
            version: packageJson.version,
        });
    },
};
