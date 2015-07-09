// Write the concatenated source for the browser to stdout

// Order matters -- dependencies must be listed before modules dependent on them.

var modules = [
  'utils/arrays',
  'utils/objects',
  'utils/classes',
  'grammar-error',
  'parser',
  'compiler/visitor',
  'compiler/asts',
  'compiler/opcodes',
  'compiler/javascript',
  'compiler/passes/ast-to-stackvm',
  'compiler/passes/ast-to-regalloc-js',
  'compiler/passes/stackvm-to-javascript',
  'compiler/passes/remove-proxy-rules',
  'compiler/passes/report-left-recursion',
  'compiler/passes/report-infinite-loops',
  'compiler/passes/report-missing-rules',
  'compiler',
  'peg'];

var runtimeModules = [
  'runtime/common-helpers',
  'runtime/trace-helpers',
  'runtime/tracer',
  'runtime/wrapper'];

var fs = require('fs');

function readSource(moduleName) {
  var fileName = __dirname + '/../lib/' + moduleName + '.js';
  try {
    return fs.readFileSync(fileName, 'utf8');
  } catch (e) {
    if (e.code && e.code == 'ENOENT') {
      console.error("Error: Module source not found: " + fileName);
      process.exit(1);
    }
    throw e;
  }
}

var moduleDefs = [], i;
for (i = 0; i < modules.length; i++) {
  var moduleSource = readSource(modules[i]);
  moduleDefs.push(
    '  modules.define(' + JSON.stringify(modules[i]) + ', ' +
    'function(module, require, readSource) {',
    moduleSource.replace(/^.+$/mg, '    $&'),
    '  });',
    '');
  }
  
for (i = 0; i < runtimeModules.length; i++) {
  var moduleSource = readSource(runtimeModules[i]);
  moduleDefs.push(
    '  modules.define(' + JSON.stringify(runtimeModules[i]) + ', function(module, require) {',
    '    module.exports.code = ' + JSON.stringify(moduleSource),
    '  });',
  '');
}

var code = readSource('runtime/browser-main')
  .replace('/*$MODULES*/', moduleDefs.join('\n').replace(/\$/g, '$$$$'));

process.stdout.write(code);
