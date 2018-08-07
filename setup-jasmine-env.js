/**
 * Add custom settings to Jasmine.
 */

/*globals jasmine*/
/*
jasmine.VERBOSE = false;

require('jasmine-expect');
require('jasmine-expect-moment');

var reporters = require('jasmine-reporters');

var reporter = new reporters.JUnitXmlReporter({
    savePath: __dirname + '/log/',
    consolidateAll: false
});
jasmine.getEnv().addReporter(reporter);

// Enable Teamcity Reporter if a Teamcity environment is detected
if (process.env.TEAMCITY_VERSION) {
    var teamcity = new reporters.TeamCityReporter();
    jasmine.getEnv().addReporter(teamcity);
}
*/