var arrays  = require("./utils/arrays"),
    objects = require("./utils/objects");

var compiler = {
  /*
   * Compiler passes.
   *
   * Each pass is a function that is passed the AST. It can perform checks on it
   * or modify it as needed. If the pass encounters a semantic error, it throws
   * |PEG.GrammarError|.
   */
  passes: {
    check: {
      reportMissingRules:  require("./compiler/passes/report-missing-rules"),
      reportLeftRecursion: require("./compiler/passes/report-left-recursion")
    },
    transform: {
      removeProxyRules:    require("./compiler/passes/remove-proxy-rules")
    },
    generate: {
      generateBytecode:    require("./compiler/passes/generate-bytecode"),
      generateJavascript:  require("./compiler/passes/generate-javascript")
    }
  },

  /*
   * Generates a parser from a specified grammar AST. Throws |PEG.GrammarError|
   * if the AST contains a semantic error. Note that not all errors are detected
   * during the generation and some may protrude to the generated parser and
   * cause its malfunction.
   */
  compile: function(ast, passes) {
    var options = arguments.length > 2 ? objects.clone(arguments[2]) : {},
        stage;

    objects.defaults(options, {
      allowedStartRules:  [ast.rules[0].name],
      cache:              false,
      optimize:           "speed",
      output:             "parser"
    });

    for (stage in passes) {
      if (passes.hasOwnProperty(stage)) {
        arrays.each(passes[stage], function(p) { p(ast, options); });
      }
    }

    switch (options.output) {
      case "parser": return eval(ast.code);
      case "source": return ast.code;
      case "ast": return ast;
      case "lintableJavascript": return eachCode(ast);
    }
  }
};
function eachCode(ast) {
        var initializer = "";
        function getLabels(node, parent) {
          var container = node.expression || parent;
          if (container.type === "sequence") {
            return container.elements
              .filter(function(child) {
                return (child.type === "labeled");
              })
              .map(function(child) {
                return child.label;
              });
          } else {
            return ("label" in container ? [container.label] : []);
          }
        }
        function eachNode(node, callback, parent) {
          callback(node, parent || null);
          var children = node.alternatives || node.elements || node.rules;
          if (children) {
            children.forEach(function(child) {
              eachNode(child, callback, node);
            });
          } else if (node.expression) {
            eachNode(node.expression, callback, node);
          }
        }
        var javascript = "", currentline = 1, currentcolumn =0,  currentOffset = 0;
        
        if (ast.initializer) {
          initializer = ast.initializer;
          javascript = ast.location.source.slice(0, initializer.location.range[0]) + initializer.location.source.replace(/(?:^({)|(})(?=(?:[\s\S](?!}))*?$))/g, " ");
          currentline = initializer.location.end.line;
          currentcolumn = initializer.location.end.column;
          currentOffset = initializer.location.range[1];
        }
        var counter = 0, nodes = [];
        ast.rules.forEach(function(rule) {
          eachNode(rule.expression, function(node, parent) {
            if ("code" in node) {
              nodes.push([node, parent]);
            }
          }, rule);
        });
        nodes.sort(function(a, b) {
          var node1 = a[0];
          var node2 = b[0];
          var codeOffset1 = node1.location.source.indexOf(node1.code);
          var codeOffset2 = node2.location.source.indexOf(node2.code);
          return (node1.location.range[0]+ codeOffset1) - (node2.location.range[0] + codeOffset2);
        });
        nodes.forEach(function (p){
              var node = p[0];
              var parent = p[1];
               var re = /("\r\n"|[\r\n\u2028\u2029])/g;
              var codeOffset = node.location.source.indexOf(node.code);
              var match = node.location.source.slice(0, codeOffset).match(re);
              var lines = ( match !== null) ? match.length: 0;
              var codeStartLine = node.location.start.line + lines;
              var codeStartColumn;
              var result = re.exec(node.location.source.slice(0, codeOffset));
              if (result && re.lastIndex !== -1) {
                codeStartColumn = node.location.source.slice(re.lastIndex, codeOffset).length;
              } else {
                codeStartColumn = node.location.start.column + node.location.source.slice(0, codeOffset).length;
              }
              match = ast.location.source.slice(currentOffset, node.location.range[0]+codeOffset).match(re);
              lines = ( match !== null) ? match.length+1: 0;
              var temp = "function l$l" + counter + " (" + getLabels(node, parent).join(",") +  "){";
              /*javascript += temp;
              javascript += new Array(lines).join("\n");
              javascript += new Array(codeStartColumn).join(" ");
              */
              if (temp.length <= codeStartColumn) {
                javascript += new Array(lines).join("\n");
                javascript += temp;
                javascript += new Array(codeStartColumn-temp.length).join(" ");
              } else if (lines > 0) {
                javascript += new Array(lines-1).join("\n");
                javascript += temp + "\n";
                javascript += new Array(codeStartColumn).join(" ");
              } else {
                javascript += temp;
                javascript += new Array(lines).join("\n");
                javascript += new Array(codeStartColumn).join(" ");
              }
              javascript += node.code;
              javascript += "}l$l" + counter + ".t=true;";
              counter ++;
              currentOffset = node.location.range[0] + codeOffset + node.code.length;
        });
        return javascript;
      }
      

module.exports = compiler;
