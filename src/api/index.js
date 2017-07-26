const Home = require('./handlers/home')
    , User = require('./handlers/user')
    , Period = require('./handlers/period')
    , PeriodTypes = require('./handlers/periodTypes')
    , Timesheet = require('./handlers/timesheet');

exports.register = (plugin, options, next) => {
    plugin.route([
        // Home
        { method: 'GET' , path: '/', config: Home.hello },

        // User
        { method: 'GET' , path: '/users', config: User.list },
        { method: 'GET' , path: '/users/{id}', config: User.findById },

        // Timesheet
        { method: 'GET' , path: '/users/{userId}/timesheet/{from}/{to}', config: Timesheet.timesheetFromToById },

        // Period
        { method: 'POST', path: '/users/{userId}/periods', config: Period.create },
        { method: 'PUT' , path: '/users/{userId}/periods/{per_id}', config: Period.update },
        { method: 'DELETE' , path: '/users/{userId}/periods/{per_id}', config: Period.delete },

        // PeriodTypes
        { method: 'GET' , path: '/period-types', config: PeriodTypes.list },
        
    ]);
    next();
};

exports.register.attributes = {
    name: 'api'
};