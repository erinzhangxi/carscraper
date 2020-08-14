const mongoose = require('mongoose');

mongoose.set('debug', process.env.MONGO_DEBUG === 'true');

let mongoDB = null;

module.exports.connect = function (config, callback) {

  mongoose.Promise = global.Promise;

  mongoose.connect(config.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    useFindAndModify: true,
    keepAlive: true,
    poolSize: 10,
  });

  mongoDB = mongoose.connection;

  mongoDB.on('error', function (mongoError) {
    console.error('[ERROR] MongoDB Error:', mongoError);
    if (typeof callback !== 'undefined') callback(mongoError);
    throw mongoError;
  });

  mongoDB.on('open', function () {
    if (typeof callback !== 'undefined') callback();
  });

  return mongoDB;
};

module.exports.disconnect = function () {
  mongoDB.close();
};
