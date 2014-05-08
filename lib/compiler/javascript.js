/* JavaScript code generation helpers. */
var javascript = {
  /*
   * Returns a string padded on the left to a desired length with a character.
   *
   * The code needs to be in sync with the code template in the compilation
   * function for "action" nodes.
   */
  padLeft: function(input, padding, length) {
    var result = input;

    var padLength = length - input.length;
    for (var i = 0; i < padLength; i++) {
      result = padding + result;
    }

    return result;
  },

  /*
   * Returns an escape sequence for given character. Uses \x for characters <=
   * 0xFF to save space, \u for the rest.
   *
   * The code needs to be in sync with the code template in the compilation
   * function for "action" nodes.
   */
  escape: function(ch) {
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

    return '\\' + escapeChar + javascript.padLeft(charCode.toString(16).toUpperCase(), '0', length);
  },

  /*
   * Surrounds the string with quotes and escapes characters inside so that the
   * result is a valid JavaScript string.
   *
   * The code needs to be in sync with the code template in the compilation
   * function for "action" nodes.
   */
  quote: function(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
     * literal except for the closing quote character, backslash, carriage
     * return, line separator, paragraph separator, and line feed. Any character
     * may appear in the form of an escape sequence.
     *
     * For portability, we also escape all control and non-ASCII characters.
     * Note that "\0" and "\v" escape sequences are not used because JSHint does
     * not like the first and IE the second.
     */
    return '"' + s
      .replace(/\\/g, '\\\\')    // backslash
      .replace(/"/g, '\\"')      // closing quote character
      .replace(/\x08/g, '\\b')   // backspace
      .replace(/\t/g, '\\t')     // horizontal tab
      .replace(/\n/g, '\\n')     // line feed
      .replace(/\f/g, '\\f')     // form feed
      .replace(/\r/g, '\\r')     // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, javascript.escape)
      + '"';
  },

  /*
   * Escapes characters inside the string so that it can be used as a list of
   * characters in a character class of a regular expression.
   */
  quoteForRegexpClass: function(s) {
    /*
     * Based on ECMA-262, 5th ed., 7.8.5 & 15.10.1.
     *
     * For portability, we also escape all control and non-ASCII characters.
     */
    return s
      .replace(/\\/g, '\\\\')    // backslash
      .replace(/\//g, '\\/')     // closing slash
      .replace(/\]/g, '\\]')     // closing bracket
      .replace(/\^/g, '\\^')     // caret
      .replace(/-/g,  '\\-')     // dash
      .replace(/\0/g, '\\0')     // null
      .replace(/\t/g, '\\t')     // horizontal tab
      .replace(/\n/g, '\\n')     // line feed
      .replace(/\v/g, '\\x0B')   // vertical tab
      .replace(/\f/g, '\\f')     // form feed
      .replace(/\r/g, '\\r')     // carriage return
      .replace(/[\x01-\x08\x0E-\x1F\x80-\uFFFF]/g, javascript.escape);
  }
};

module.exports = javascript;
