/*
 * Compiler-Options
 * TODO: add possibility to set all options within the peg-grammar
 * 
 * selfParsing {bool}
 *     default: false
 *
 *     Omit members from utils.js on self-parsing (for internal use)
 */
 
function mergedOptions( ){
  var i, options, al;
  var defaultOptions = {
    selfParsing: false
  };
  
  function eachInObj (obj, fun) {
    for (var name in obj) {
      if (obj.hasOwnProperty(name)) {
        fun(name, obj[name]);
      }
    }
  }
  
  function merge(obj) {
    if (obj && typeof obj === "object") {
      eachInObj(obj, function(name, val) {
        if (val !== undefined && val !== null) {
          options[name] = val;
        }
      });
    }
  }
  
  // create combined object
  options = { };
  merge( defaultOptions );
  al = arguments.length;
  
  if (al > 0 && (!!arguments[0] || al > 1 )) {
    for (i = 0; i < al; i++) {
      merge( arguments[i] );
    }
  }
  return options;
}
