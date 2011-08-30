/*
 * Compiler-Options
 * TODO: add possibility to set all options within the peg-grammar
 * 
 * selfParsing {bool}
 *     default: false
 *
 *     Omit members from utils.js on self-parsing (for internal use)
 * 
 * startRules {string[]} / {string}
 *     default: []
 *
 *     The available start rule(s).
 *     {string} is splitted by \s+ into {string[]}
 *     Be as restrictive as possible. This helps to minify the script
 */
 
function mergedOptions( ){
  var i, options, al;
  var defaultOptions = {
    // propertyName: [defaultValue, normalize-function?]
    selfParsing: [false],
    startRules: [[], normalize_stringArray]
  };
  
  function eachInObj (obj, fun) {
    for (var name in obj) {
      if (obj.hasOwnProperty(name)) {
        fun(name, obj[name]);
      }
    }
  }
  
  function merge(obj, isDefault) {
    if (obj && typeof obj === "object") {
      eachInObj(obj, function(name, val) {
        if (val !== undefined && val !== null) {
          options[name] = isDefault ? val[0] : val;
        }
      });
    }
  }
  
  function normalize_stringArray( value ) {
    if (value !== undefined && value !== null) {
      if (typeof value === "string") {
        return value.split(/\s+/g);
      } else if ( typeof value === "object" ) {
        if (value instanceof Array) {
          value.forEach(function(v) {v = v + "";}); // string-array
		  return value;
        }
      }
    }
    return [];
  }
  
  // create combined object
  options = { };
  merge( defaultOptions, true );
  al = arguments.length;
  
  if (al > 0 && (!!arguments[0] || al > 1 )) {
    for (i = 0; i < al; i++) {
      merge( arguments[i] );
    }
    
    // normalize values (if options are provided)
    eachInObj(defaultOptions, function(name, val) {
      if (val !== undefined && val !== null && val.length > 1 && val[1]) {
        options[name] = val[1]( options[name] );
      }
    });
  }
  return options;
}
