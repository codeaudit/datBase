var validator = require('is-my-json-valid')
var concat = require('concat-stream')
var debug = require('debug')('level-rest')

module.exports = LevelREST

function LevelREST(db, options) {
  if (!(this instanceof LevelREST)) return new LevelREST(db, options)
  options = options || {}
  this.db = db
  this.options = options
  if (options.schema) this.validate = validator(options.schema)
  this.generateId = options.generateId || function() {
    return +Date.now()
  }.bind(this)
}

LevelREST.prototype.get = function(opts, cb) {
  var self = this
  debug('get', opts)
  if (!opts.id) return this.getAll(opts, cb)
  this.db.get(opts.id, opts, function(err, row) {
    if (err) return cb(err)
    cb(null, row.value)
  })
}

LevelREST.prototype.getAll = function(opts, cb) {
  var self = this
  debug('getAll', opts)
  if (!opts.limit) opts.limit = this.options.pageLimit || 50
  if (opts.limit > this.options.pageLimit) {
    var msg = 'limit must be under ' + this.options.pageLimit
    return cb(new Error(msg))
  }
  var getStream = this.db.createValueStream(opts)
  getStream.on('error', cb)
  getStream.pipe(concat(function concatenator(rows) {
    cb(null, rows)
  }))
}

LevelREST.prototype.put = function(data, opts, cb) {
  if (!opts) opts = {}
  debug('put', data, opts)
  if (!this.validate(data)) {
    var errors = this.validate.errors
    var error = new Error('put/post failed due to schema validation errors')
    error.errors = errors
    return cb(error)
  }
  db.put(opts.id, data, opts, function(err) {
    if (err) return cb(err)
    cb(null, opts.id)
  })
}

LevelREST.prototype.post = function(data, opts, cb) {
  if (!opts) opts = {}
  if (!opts.id) opts.id = this.generateId()
  debug('post', data, opts)
  this.put(data, opts, cb)
}

// Delete a record on an endpoint, ie: DELETE posts/123
LevelREST.prototype.delete = function(opts, cb) {
  if (!opts) opts = {}
  debug('delete', opts)
  db.del(opts.id, opts, function(err) {
    if (err) return cb(err)
    cb()
  })
}
