var PEG  = require("./lib/peg");
var through = require("through2");

// apply PEG.js to given grammar file(s)
module.exports = function(opts) {
  opts           = opts           || {};
  opts.cache     = opts.cache     || false;
  opts.output    = opts.output    || "source";
  opts.optimize  = opts.optimize  || "speed";
  opts.exportVar = opts.exportVar || "module.exports";

  return through.obj(function(file, enc, cb) {
    try {
      var grammar = file.contents.toString("utf8");
      var parser = PEG.buildParser(grammar, opts);
      if (opts.exportVar !== "") {
        parser = opts.exportVar + " = " + parser + ";\n";
      } else {
        parser += "\n";
      }
      file.path = file.path.replace(/\.[^\.]+$/, ".js");
      file.contents = new Buffer(parser);
      this.push(file);
      return cb();
    } catch(e) {
      this.emit("error", e);
      return cb();
    }
  });
};
