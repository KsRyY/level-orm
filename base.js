var through2 = require('through2');

/**
 * Create the Model base class
 *
 * @param {sublevel} sublevel implementation to use
 */

module.exports = function (sublevel) {

  /**
   * Model
   */

  function Models(container, name, key) {
    this.name = name;
    this.key = key;
    this.container = container;
    this.db = sublevel(container.db || container);
    this.sublevel = this.db.sublevel(name);
  }

  Models.prototype.all = function(cb) {
    var models = [];
    this.sublevel.createReadStream().pipe(through2.obj(write, end));
    function write(model, enc, next) {
      models.push(model.value);
      next();
    }
    function end(next) {
      cb(null, models);
      next();
    }
  };

  Models.prototype.save = function(model, cb) {
    var key = this.getKey(model);
    this.sublevel.put(key, model, function (err) {
      if (err) return cb(err);
      cb(null, key);
    });
  };

  Models.prototype.get = function(key, cb) {
    this.sublevel.get(key, function (err, data) {
      if (err) return cb(err);
      cb(null, data);
    });
  };

  Models.prototype.del = function(key, cb) {
    this.sublevel.del(key, cb);
  };

  Models.prototype.getKey = function(model) {
    if (typeof model[this.key] === 'undefined' && this.keyfn) {
      var key = this.keyfn(model);
      model[this.key] = key;
      return key;
    } else if (Array.isArray(this.key)) {
      return this.key.map(function (prop) {
        return model[prop];
      });
    } else {
      return model[this.key];
    }
  };

  Models.prototype.createReadStream = function(options) {
    options = options || { };
    if (typeof options.keys === 'undefined') options.keys = false;
    return this.sublevel.createReadStream(options);
  };

  return Models;
};

