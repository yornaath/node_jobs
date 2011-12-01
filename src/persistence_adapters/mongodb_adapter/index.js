
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
      scheduled_for_every:    {type: Number}
    }))
  }

  Adapter.prototype.getAll = function(cb) {
    var docs = []
    for(jid in mockdb) {
      docs.push(mockdb[jid])
    }
    cb(false, docs)
  }

  Adapter.prototype.save = function(cb) {
    var _job = this.generateDbRepresentation()
    _job._id = mockid++
    mockdb[_job._id] = _job
    cb(false)
  }

  Adapter.prototype.destroy = function(cb) {
    cb(false)
  }  

  return Adapter
})


module.exports = Adapter