var inspect, inspect_ast, inspect_options, util;

util = require("util");

inspect_options = {
  colors: true,
  depth: null
};

inspect = function(object, title) {
  if (title) {
    console.log(title);
  }
  if (object) {
    console.log(util.inspect(object, inspect_options));
    console.log("\n");
  }
};

inspect_ast = function(ast, options) {
  if (options) {
    inspect(options);
  }
  inspect(ast, "ast:");
};

module.exports.use = function(config, options) {
  console.log("-= using debug plugin =- \n");
  inspect(config, "config:");
  inspect(options, "options:");
  ['check', 'transform', 'generate'].forEach(function(stage) {
    config.passes[stage].unshift(function() {
      console.log("running stage: " + stage + "...");
    });
    config.passes[stage].push(function(ast, options) {
      console.log("completed stage: " + stage);
      inspect_ast(ast, options);
    });
  });
};
