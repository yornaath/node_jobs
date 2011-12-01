
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId


var Adapter = (function() {

  function Adapter() {
    this.connection = undefined
    this.model = undefined
  }

  Adapter.prototype.connect = function(host, database, port, options) {
    this.connection = mongoose.createConnection(host, database, port, options)
    this.model = this.connection.model('Jobspec', new Schema({
      url:                    {type: String},
      state:                  {type: String},
      scheduled_at_timestamp: {type: Number},
      scheduled_for_every:    {type: Number},
      persisted:              {type: Boolean}
    }))
  }

  Adapter.prototype.getAll = function(cb) {
    this.model.find(function(err, specs) {
      if(err) return cb.call(this, err)
      cb.call(this, false, specs)
    })
  }

  Adapter.prototype.save = function(job, cb) {
    var model = this.model,
        jobspec = job.generateDbRepresentation(),
        _job = new model;
    for(key in jobspec) {
      _job[key] = jobspec[key]
    }
    _job.save(function(err) {
      if(err) return cb.call(this, err)
      job._id = _job._id
      job.persisted = true
      return cb.call(this, false, job)
    })
  }

  Adapter.prototype.destroy = function(job, cb) {
    var model = this.model;
    if(job._id && job.persisted) {
      model.find({_id: job._id}, function(err) {
        if(err) return cb.call(this, err)
        return cb.call(this, false)
      })
    }
    return cb.call(this, 'Cannot call destroy on unpersisted job') 
  }  

  return Adapter
})();


module.exports = Adapter







