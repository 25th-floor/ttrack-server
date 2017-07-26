const Home = require('./handlers/home')
    , User = require('./handlers/user')
    , PeriodTypes = require('./handlers/periodTypes');

exports.register = (plugin, options, next) => {
    plugin.route([
        { method: 'GET' , path: '/', config: Home.hello },
        { method: 'GET' , path: '/users', config: User.list },
        { method: 'GET' , path: '/users/{id}', config: User.findById },
        { method: 'GET' , path: '/users/{userId}/timesheet/{from}/{to}', config: User.timesheetFromToById },
        
        { method: 'POST', path: '/users/{userId}/periods', config: User.createPeriod },
        { method: 'PUT' , path: '/users/{userId}/periods/{per_id}', config: User.updatePeriod },
        { method: 'DELETE' , path: '/users/{userId}/periods/{per_id}', config: User.deletePeriod },
        { method: 'GET' , path: '/period-types', config: PeriodTypes.list },
        
    ]);
    next();
};

exports.register.attributes = {
    name: 'api'
};