var hasOwnProp = Object.prototype.hasOwnProperty;

var classExtends = function(child, parent) { 
  for (var key in parent) { 
    if (hasOwnProp.call(parent, key)) child[key] = parent[key]; 
  } 
  function ctor() { 
    this.constructor = child; 
  } 
  ctor.prototype = parent.prototype; 
  child.prototype = new ctor; 
  child.__super__ = parent.prototype; 
  return child;
};

var parseTimeString = function(){
  var mappings = { }
  mappings['second']   = 1000
  mappings['minute']   = mappings.second * 60
  mappings['hour']     = mappings.minute * 60
  mappings['day']      = mappings.hour * 24
  mappings['week']     = mappings.day * 7
  return function(time) {
    var i,
      value_unit_pairs, 
      pair_string, 
      value_unit_strings,
      pairs,
      pair,
      converted_to_ms;
    if(typeof time == 'number') return time
    if(typeof time == 'object' && !/[a-z]/.test(time)) return parseFloat(time)
    value_unit_strings = time.split(/\s/)
    pairs = []
    for (i = value_unit_strings.length - 1; i >= 0; i--) {
      pair_string = value_unit_strings[i];
      pairs.push(/([0-9]*)([a-z]*)/i.exec(pair_string).slice(1))
    };
    converted_to_ms = 0
    for(i = pairs.length-1; i >= 0; i--) {
      pair = pairs[i];
      converted_to_ms = converted_to_ms + (mappings[pair[1]] * pair[0])
    }
    return converted_to_ms    
  }
}()


module.exports = {
  classExtends: classExtends,
  parseTimeString: parseTimeString
}