#!/usr/bin/env node
/*
  copied and adapted from the jquery project
  https://github.com/jquery/jquery
*/
var JSHINT = require("./lib/jshint.js").JSHINT,
  print = require("sys").print,
  src = require("fs").readFileSync( process.argv[2], "utf8" );

JSHINT(
  src,
  {
    asi         : false, // if automatic semicolon insertion should be tolerated
    bitwise     : true,  // if bitwise operators should not be allowed
    boss        : false, // if advanced usage of assignments should be allowed
    curly       : true,  // if curly braces around blocks should be required (even in if/for/while)
    debug       : false, // if debugger statements should be allowed
    devel       : false, // if logging globals should be predefined (console, alert, etc.)
    eqeqeq      : true,  // if === should be required
    eqnull      : false, // if == null comparisons should be tolerated
    es5         : true,  // if ES5 syntax should be allowed
    evil        : true,  // if eval should be allowed
    expr        : false, // if ExpressionStatement should be allowed as Programs
    forin       : false, // if for in statements must filter
    globalstrict: false, // if global "use strict"; should be allowed (also enables 'strict')
    immed       : false, // if immediate invocations must be wrapped in parens
    indent      : 2,     // the indentation factor
    latedef     : false, // if the use before definition should not be tolerated
    laxbreak    : true,  // if line breaks should not be checked
    loopfunc    : false, // if functions should be allowed to be defined within loops
    maxerr      : 50,    // the maximum number of errors to allow
    newcap      : true,  // if constructor names must be capitalized
    noarg       : true,  // if arguments.caller and arguments.callee should be disallowed
    noempty     : true,  // if empty blocks should be disallowed
    nonew       : true,  // if using `new` for side-effects should be disallowed
    nomen       : false, // if names should be checked
    onevar      : false, // if only one var statement per function should be allowed
    passfail    : false, // if the scan should stop on first error
    plusplus    : false, // if increment/decrement should not be allowed
    regexp      : false, // if the . should not be allowed in regexp literals
    undef       : false, // if variables should be declared before used
    shadow      : false, // if variable shadowing should be tolerated
    strict      : false, // require the "use strict"; pragma
    sub         : false, // if all forms of subscript notation are tolerated
    supernew    : false, // if `new function () { ... };` and `new Object;` should be tolerated
    trailing    : false, // if trailing whitespace rules apply
    white       : false, // if strict whitespace rules apply

    browser     : false, // if the standard browser globals should be predefined
    couch       : false, // if CouchDB globals should be predefined
    jquery      : false, // if jQuery globals should be predefined
    mootools    : false, // if MooTools globals should be predefined
    node        : false, // if the Node.js environment globals should be predefined
    prototypejs : false, // if Prototype and Scriptaculous globals should be predefined
    rhino       : false, // if the Rh    "vars" in function formatCode, line 4238ino environment globals should be predefined
    wsh         : false, // if the Windows Scripting Host environment globals should be predefined

    predef      : ["window", "module"]
  }
);

var  ignore = {
  },
  e = JSHINT.errors,
  el = e.length,
  found = 0,
  w;

for (var i = 0; i < el; i++) {
  w = e[i];
  if (!!w){
    if (!w.id || w.id != "(error)"){
      print( "\n" + w.reason );
    } else if (!ignore[w.reason]) {
      found++;
      print( "Problem at line " + w.line + " character " + w.character + "\n" );
      print( "    " + w.reason + "\n" );
      print( "    " + ( "" + w.evidence ).replace( /^\s+/, "" ) + "\n" );
    }
  }
}

if (found > 0) {
  print( "\n" + found + " Error(s) found.\n" );
} else {
  print( "JSHint check passed.\n" );
}

if (JSHINT.data){
  var r = JSHINT.data();
  var us = r.unused;
  if (us){
    var ul = us.length, first = false;
    for (i = 0; i < ul; i++) {
      var u = us[i];
      if (u.name != "undefined"){ // "var undefined;" is allowed
        if (!first){
          first = true;
          print("\nUnused variables:");
        }
        print("\n    \"" + u.name + "\" in function " + u['function'] + ", line " + u.line);
      }
    }
  }
}