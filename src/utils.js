/* Like Python's |range|, but without |step|. */
function range(start, stop) {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }

  var result = new Array(Math.max(0, stop - start));
  for (var i = 0, j = start; j < stop; i++, j++) {
    result[i] = j;
  }
  return result;
}

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
    callback(array[i], i);
  }
}

function map(array, callback) {
  var result = [];
  var length = array.length;
  for (var i = 0; i < length; i++) {
    result[i] = callback(array[i], i);
  }
  return result;
}

/*
 * Returns a string padded on the left to a desired length with a character.
 *
 * The code needs to be in sync with the code template in the compilation
 * function for "action" nodes.
 */
function padLeft(input, padding, length) {
  var result = input;

  var padLength = length - input.length;
  for (var i = 0; i < padLength; i++) {
    result = padding + result;
  }

  return result;
}

/*
 * Returns an escape sequence for given character. Uses \x for characters <=
 * 0xFF to save space, \u for the rest.
 *
 * The code needs to be in sync with the code template in the compilation
 * function for "action" nodes.
 */
function escape(ch) {
  var charCode = ch.charCodeAt(0);
  var escapeChar;
  var length;

  if (charCode <= 0xFF) {
    escapeChar = 'x';
    length = 2;
  } else {
    escapeChar = 'u';
    length = 4;
  }

  return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
}

/*
 * Surrounds the string with quotes and escapes characters inside so that the
 * result is a valid JavaScript string.
 *
 * The code needs to be in sync with the code template in the compilation
 * function for "action" nodes.
 */
function quote(s) {
  /*
   * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
   * literal except for the closing quote character, backslash, carriage return,
   * line separator, paragraph separator, and line feed. Any character may
   * appear in the form of an escape sequence.
   *
   * For portability, we also escape escape all control and non-ASCII
   * characters. Note that "\0" and "\v" escape sequences are not used because
   * JSHint does not like the first and IE the second.
   */
  return '"' + s
    .replace(/\\/g, '\\\\')  // backslash
    .replace(/"/g, '\\"')    // closing quote character
    .replace(/\x08/g, '\\b') // backspace
    .replace(/\t/g, '\\t')   // horizontal tab
    .replace(/\n/g, '\\n')   // line feed
    .replace(/\f/g, '\\f')   // form feed
    .replace(/\r/g, '\\r')   // carriage return
    .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
    + '"';
}

/*
 * Escapes characters inside the string so that it can be used as a list of
 * characters in a character class of a regular expression.
 */
function quoteForRegexpClass(s) {
  /*
   * Based on ECMA-262, 5th ed., 7.8.5 & 15.10.1.
   *
   * For portability, we also escape escape all control and non-ASCII
   * characters.
   */
  return s
    .replace(/\\/g, '\\\\')  // backslash
    .replace(/\//g, '\\/')   // closing slash
    .replace(/\]/g, '\\]')   // closing bracket
    .replace(/-/g, '\\-')    // dash
    .replace(/\0/g, '\\0')   // null, IE needs this
    .replace(/\t/g, '\\t')   // horizontal tab
    .replace(/\n/g, '\\n')   // line feed
    .replace(/\v/g, '\\x0B') // vertical tab
    .replace(/\f/g, '\\f')   // form feed
    .replace(/\r/g, '\\r')   // carriage return
    .replace(/[\x01-\x08\x0E-\x1F\x80-\uFFFF]/g, escape);
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
  };
}
