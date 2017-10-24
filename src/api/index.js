const Home = require('./handlers/home');
const Period = require('./handlers/period');
const PeriodTypes = require('./handlers/periodTypes');
const Timesheet = require('./handlers/timesheet');
const User = require('./handlers/user');
const Vacations = require('./handlers/vacations');

exports.register = (plugin, options, next) => {
    plugin.route([
        // User
        { method: 'GET', path: '/users', config: User.list },
        { method: 'GET' , path: '/users/{id}', config: User.findById },

        // Timesheet
        { method: 'GET' , path: '/users/{userId}/timesheet/{from}/{to}', config: Timesheet.timesheetFromToById },

        // Period
        { method: 'POST', path: '/users/{userId}/periods', config: Period.create },
        { method: 'PUT' , path: '/users/{userId}/periods/{per_id}', config: Period.update },
        { method: 'DELETE' , path: '/users/{userId}/periods/{per_id}', config: Period.delete },

        // PeriodTypes
        { method: 'GET' , path: '/period-types', config: PeriodTypes.list },
        
        // Vacations
        { method: 'GET' , path: '/vacations', config: Vacations.list },

        // Home
        { method: 'GET' , path: '/', config: Home.list },
    ]);
    next();
};

exports.register.attributes = {
    name: 'api'
};