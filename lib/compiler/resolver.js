var GrammarError = require("../grammar-error"),
    parser       = require("../parser"),
    arrays       = require("../utils/arrays");

var imported = [];

function Resolver() {
  if (arguments.length > 0) {
    var read = arguments[0];
    if (typeof read !== 'function') {
      throw new GrammarError('Expected function for Resolver argument, but got '+(typeof read));
    }
    this.read = read;
  }
}

Resolver.prototype = {
  read: function(path) {
    var fullPath = require("path").resolve(path);
    return {
      path: fullPath,
      data: require("fs").readFileSync(fullPath, 'utf-8')
    };
  },
  resolve: function(path, alias, options) {
    var data = this.read(path, alias, options);
    var has = arrays.contains(imported, function(e) { return e.path === data.path; });
    imported.push({ path: data.path, alias: alias });
    if (has) {
      var message = arrays.map(imported, function(e) { return e.path + ' as "' + e.alias + '"'; });
      throw new GrammarError("Cyclic include dependence for included grammars!:\n" + message.join('\n'));
    }
    return parser.parse(data.data, options);
  },
  done: function() {
    imported.pop();
  }
};

module.exports = Resolver;