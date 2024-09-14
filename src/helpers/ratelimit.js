const async = require('async');

const queue = async.queue((task, callback) => {
    task.fn().then(callback).catch(callback);
}, 45);

module.exports = queue;
