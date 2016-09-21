"use strict";

function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

// JavaScript code generation helpers.
let js = {
  stringEscape: function(s) {
    // ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a string
    // literal except for the closing quote character, backslash, carriage
    // return, line separator, paragraph separator, and line feed. Any character
    // may appear in the form of an escape sequence.
    //
    // For portability, we also escape all control and non-ASCII characters.
    return s
      .replace(/\\/g,   "\\\\")   // backslash
      .replace(/"/g,    "\\\"")   // closing double quote
      .replace(/\0/g,   "\\0")    // null
      .replace(/\x08/g, "\\b")    // backspace
      .replace(/\t/g,   "\\t")    // horizontal tab
      .replace(/\n/g,   "\\n")    // line feed
      .replace(/\v/g,   "\\v")    // vertical tab
      .replace(/\f/g,   "\\f")    // form feed
      .replace(/\r/g,   "\\r")    // carriage return
      .replace(/[\x00-\x0F]/g,          ch => "\\x0" + hex(ch))
      .replace(/[\x10-\x1F\x7F-\xFF]/g, ch => "\\x"  + hex(ch))
      .replace(/[\u0100-\u0FFF]/g,      ch => "\\u0" + hex(ch))
      .replace(/[\u1000-\uFFFF]/g,      ch => "\\u"  + hex(ch));
  },

  regexpClassEscape: function(s) {
    // Based on ECMA-262, 5th ed., 7.8.5 & 15.10.1.
    //
    // For portability, we also escape all control and non-ASCII characters.
    return s
      .replace(/\\/g,   "\\\\")   // backslash
      .replace(/\//g,   "\\/")    // closing slash
      .replace(/\]/g,   "\\]")    // closing bracket
      .replace(/\^/g,   "\\^")    // caret
      .replace(/-/g,    "\\-")    // dash
      .replace(/\0/g,   "\\0")    // null
      .replace(/\x08/g, "\\b")    // backspace
      .replace(/\t/g,   "\\t")    // horizontal tab
      .replace(/\n/g,   "\\n")    // line feed
      .replace(/\v/g,   "\\v")    // vertical tab
      .replace(/\f/g,   "\\f")    // form feed
      .replace(/\r/g,   "\\r")    // carriage return
      .replace(/[\x00-\x0F]/g,          ch => "\\x0" + hex(ch))
      .replace(/[\x10-\x1F\x7F-\xFF]/g, ch => "\\x"  + hex(ch))
      .replace(/[\u0100-\u0FFF]/g,      ch => "\\u0" + hex(ch))
      .replace(/[\u1000-\uFFFF]/g,      ch => "\\u"  + hex(ch));
  }
};

module.exports = js;
