function contains(array, value) {
  /*
   * Stupid IE does not have Array.prototype.indexOf, otherwise this function
   * would be a one-liner.
   */
  var length = array.length;
  for (var i = 0; i < length; i++) {
    if (array[i] === value) {
      return true;
    }
  }
  return false;
}

function each(array, callback) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    callback(array[i]);
  }
}

function map(array, callback) {
  var result = [];
  var length = array.length;
  for (var i = 0; i < length; i++) {
    result[i] = callback(array[i]);
  }
  return result;
}

/*
 * Surrounds the string with quotes and escapes characters inside so that the
 * result is a valid JavaScript string.
 *
 * The code needs to be in sync with th code template in the compilation
 * function for "action" nodes.
 */
function quote(s) {
  /*
   * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
   * literal except for the closing quote character, backslash, carriage return,
   * line separator, paragraph separator, and line feed. Any character may
   * appear in the form of an escape sequence.
   */
  return '"' + s
    .replace(/\\/g, '\\\\')        // backslash
    .replace(/"/g, '\\"')          // closing quote character
    .replace(/\r/g, '\\r')         // carriage return
    .replace(/\u2028/g, '\\u2028') // line separator
    .replace(/\u2029/g, '\\u2029') // paragraph separator
    .replace(/\n/g, '\\n')         // line feed
    + '"';
};

/*
 * Escapes characters inside the string so that it can be used as a list of
 * characters in a character class of a regular expression.
 */
function quoteForRegexpClass(s) {
  /* Based on ECMA-262, 5th ed., 7.8.5 & 15.10.1. */
  return s
    .replace(/\\/g, '\\\\')        // backslash
    .replace(/\0/g, '\\0')         // null, IE needs this
    .replace(/\//g, '\\/')         // closing slash
    .replace(/]/g, '\\]')          // closing bracket
    .replace(/-/g, '\\-')          // dash
    .replace(/\r/g, '\\r')         // carriage return
    .replace(/\u2028/g, '\\u2028') // line separator
    .replace(/\u2029/g, '\\u2029') // paragraph separator
    .replace(/\n/g, '\\n')         // line feed
}

/*
 * Builds a node visitor -- a function which takes a node and any number of
 * other parameters, calls an appropriate function according to the node type,
 * passes it all its parameters and returns its value. The functions for various
 * node types are passed in a parameter to |buildNodeVisitor| as a hash.
 */
function buildNodeVisitor(functions) {
  return function(node) {
    return functions[node.type].apply(null, arguments);
  }
}
