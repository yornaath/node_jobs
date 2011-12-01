// ### Imports
var job_utils = require('./utils.js'),
    classExtends = job_utils.classExtends,
    parseTimeString = job_utils.parseTimeString;


// ### Decalarations
var Job, Jobs, states, undef = undefined;

states = {
  awake:      0,
  running:    1,
  sleeping:   2,
  finnished:  3
}


Job = (function() {

  var jid = 0;

  // ## Job
  // Representation of the job   
  // ___________
  // **name:** String, name of the job  
  // **url:** String, pointing to the script  
  function Job (spec) {
    this.name = undef
    this.url = undef
    this.jid = jid++
    this.persistent = false
    this.persisted = false
    this.state = states.awake
    
    this.interval = undef
    this.timeout = undef
    this.scheduled_at_timestamp = undef
    this.scheduled_for_every = undef

    // populate job if spec is provided
    for(value in spec) {
      this[value] = spec[value]
    }
  };

  // ### Job.exposes
  // A jobs main methods exposes these 'suggars'
  Job.prototype.exposes = function(exec) {
    var _job = this
    return {
      // #### Job.exposes.now
      // runs the script in the url at invocation
      now: function() {
        (function() {
          exec.call(this)
        }).apply(_job);
        if(_job.persistent) _job.save()
        return _job
      },
      // #### Job.exposes.every
      // runs the script at a set intervall
      every: function(time) {
        var time_in_ms = parseTimeString(time);
        (function() {
          _job.interval = setInterval.call(_job, function() {
            exec.call(this)
          }, time_in_ms);
        }).apply(_job);
        _job.scheduled_for_every = time_in_ms
        if(_job.persistent) _job.save()
        return _job
      },
      // #### Job.exposes.in
      // runs the script once, some time in the future
      in: function(time) {
        var time_in_ms = parseTimeString(time),
            time_stamp = new Date().getTime();
        (function() {
          _job.timeout = setTimeout.call(_job, function() {
            exec.call(this)
            _job.state = states.finnished
          }, time_in_ms)
        }).apply(_job);
        _job.scheduled_at_timestamp = time_stamp + time_in_ms;
        if(_job.persistent) _job.save()
        return _job
      }
    }
  }

  // ### Main methods
  // ________________


  // ### Job.run
  // Run the script at the url, when is determined by the exposes.method used
  Job.prototype.run = function() {
    var _job = this,
        _job_arguments = arguments;
    _job.state = states.running
    return this.exposes(function() {
      var _job_spec = require(_job.url)
      _job_spec.apply(_job, _job_arguments)
    })
  }

  // ### Job.sleep
  // pauses the job
  Job.prototype.sleep = function() {
    var _job = this,
        _job_arguments = arguments;
    return this.exposes(function() {
      _job.state = states.sleeping
    })
  }

  // ### Job.wake
  // wakes a sleeping job
  Job.prototype.wake = function() {
    var _job = this,
        _job_arguments = arguments;
    return this.exposes(function() {
      _job.state = states.awake
    })
  }

  // ### Job.kill
  // kills the job, and prevents it from running
  Job.prototype.kill = function() {
    var _job = this,
        _job_arguments = arguments;
    if(this.interval) clearInterval(this.interval)
    if(this.timeout) clearTimeout(this.timeout)
    _job.state = states.finnished
  }

  Job.prototype.generateDbRepresentation = function() {
    return {
      name: this.name,
      url: this.url,
      state: this.state,
      scheduled_for_every: this.scheduled_for_every,
      scheduled_at_timestamp: this.scheduled_at_timestamp,
    }
  }

  return Job
})();


// ### all_jobs
// all jobs, indexed by jid
jobs = (function() {
  
  // ## jobs
  // api for working with jobs   
  function Jobs() {}

  // ### jobs.persistenceAdapter
  // set the persistence adapter used to persist jobs
  Jobs.prototype.persistenceAdapter = function(type, host, database, port, options) {
    this.persistenceadapterClass = require(type+'_adapter')
    this.persistenceadapter = new this.persistenceadapterClass()
    this.persistenceadapter.connect(host, database, port, options)
    return this
  }

  Jobs.prototype.resumeOnRestart = function() {
    if(this.persistenceadapter) this.persistenceadapter.getAll(function(err, jobs) {
      if(err) return console.log(err)
      for (var i = jobs.length - 1; i >= 0; i--) {
        var _jobspec = jobs[i]
        var _job = new Job(_jobspec)
        console.log(_job)
        if(_job.state == states.running) {
          if(_job.scheduled_for_every) {
            _job.run().every(_job.scheduled_for_every)
          }
          if(_job.scheduled_at_timestamp) {
            var when = _job.scheduled_at_timestamp - (new Date().getTime());
            _job.run().in(when)
          }
        }
      };
    })
    return this
  }

  // ### jobs.spawn
  // creates a new job and indexes it
  Jobs.prototype.spawn = function(spec) {
    var _job;
    _job = new Job(spec)
    return _job
  }

  Jobs.prototype.spawnPersistent = function(spec) {
    var _job;
    if(this.persistenceadapter) {
      var pa = this.persistenceadapter 
      Job.prototype.save = function() {
        pa.save(this, function(err, job) {
          if(err) return console.log(err)
          all_jobs[job.jid] = job
        })
      }
      Job.prototype.destroy = function() {
        pa.destroy(this, function(err, job) {
          if(err) return console.log(err)
        })
      }
    }
    _job = new Job(spec)
    _job.persistent = true
    return _job
  }

  return new Jobs
})();




jobs.persistenceAdapter('mongodb', 'mongodb://localhost/jobs')
    .resumeOnRestart()
    .spawnPersistent({
      name: 'logger', 
      url: '../examplejobs/logger.js'
    })
    .run().every('2second')

//console.log(j.generateDbRepresentation())

























