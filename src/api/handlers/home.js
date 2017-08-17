module.exports.hello = {
    handler: function (request, reply) {
        return reply({ result: 'Hello this is the ttrack server api' });
    },
    id: 'root'
};
