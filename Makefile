# ===== Variables =====

PEGJS_VERSION = `cat $(VERSION_FILE)`

# ===== Modules =====

# Order matters -- dependencies must be listed before modules dependent on them.
MODULES = utils/arrays                          \
          utils/objects                         \
          utils/classes                         \
          grammar-error                         \
          parser                                \
          compiler/visitor                      \
          compiler/asts                         \
          compiler/opcodes                      \
          compiler/javascript                   \
          compiler/passes/generate-bytecode     \
          compiler/passes/generate-javascript   \
          compiler/passes/remove-proxy-rules    \
          compiler/passes/report-left-recursion \
          compiler/passes/report-infinite-loops \
          compiler/passes/report-missing-rules  \
          compiler                              \
          peg

# ===== Directories =====

SRC_DIR              = src
LIB_DIR              = lib
BIN_DIR              = bin
BROWSER_DIR          = browser
SPEC_DIR             = spec
BENCHMARK_DIR        = benchmark
NODE_MODULES_DIR     = node_modules
NODE_MODULES_BIN_DIR = $(NODE_MODULES_DIR)/.bin

# ===== Files =====

PARSER_SRC_FILE = $(SRC_DIR)/parser.pegjs
PARSER_OUT_FILE = $(LIB_DIR)/parser.js

BROWSER_FILE_DEV = $(BROWSER_DIR)/peg-$(PEGJS_VERSION).js
BROWSER_FILE_MIN = $(BROWSER_DIR)/peg-$(PEGJS_VERSION).min.js

VERSION_FILE = VERSION

# ===== Executables =====

JSHINT        = $(NODE_MODULES_BIN_DIR)/jshint
UGLIFYJS      = $(NODE_MODULES_BIN_DIR)/uglifyjs
JASMINE_NODE  = $(NODE_MODULES_BIN_DIR)/jasmine-node
PEGJS         = $(BIN_DIR)/pegjs
BENCHMARK_RUN = $(BENCHMARK_DIR)/run

# ===== Targets =====

# Default target
all: browser

# Generate the grammar parser
parser:
	$(PEGJS) $(PARSER_SRC_FILE) $(PARSER_OUT_FILE)

# Build the browser version of the library
browser:
	mkdir -p $(BROWSER_DIR)

	rm -f $(BROWSER_FILE_DEV)
	rm -f $(BROWSER_FILE_MIN)

	# The following code is inspired by CoffeeScript's Cakefile.

	echo '/*'                                                                          >> $(BROWSER_FILE_DEV)
	echo " * PEG.js $(PEGJS_VERSION)"                                                  >> $(BROWSER_FILE_DEV)
	echo ' *'                                                                          >> $(BROWSER_FILE_DEV)
	echo ' * http://pegjs.org/'                                                        >> $(BROWSER_FILE_DEV)
	echo ' *'                                                                          >> $(BROWSER_FILE_DEV)
	echo ' * Copyright (c) 2010-2013 David Majda'                                      >> $(BROWSER_FILE_DEV)
	echo ' * Licensed under the MIT license.'                                          >> $(BROWSER_FILE_DEV)
	echo ' */'                                                                         >> $(BROWSER_FILE_DEV)
	echo 'var PEG = (function(undefined) {'                                            >> $(BROWSER_FILE_DEV)
	echo '  "use strict";'                                                             >> $(BROWSER_FILE_DEV)
	echo ''                                                                            >> $(BROWSER_FILE_DEV)
	echo '  var modules = {'                                                           >> $(BROWSER_FILE_DEV)
	echo '    define: function(name, factory) {'                                       >> $(BROWSER_FILE_DEV)
	echo '      var dir    = name.replace(/(^|\/)[^/]+$$/, "$$1"),'                    >> $(BROWSER_FILE_DEV)
	echo '          module = { exports: {} };'                                         >> $(BROWSER_FILE_DEV)
	echo ''                                                                            >> $(BROWSER_FILE_DEV)
	echo '      function require(path) {'                                              >> $(BROWSER_FILE_DEV)
	echo '        var name   = dir + path,'                                            >> $(BROWSER_FILE_DEV)
	echo '            regexp = /[^\/]+\/\.\.\/|\.\//;'                                 >> $(BROWSER_FILE_DEV)
	echo ''                                                                            >> $(BROWSER_FILE_DEV)
	echo "        /* Can't use /.../g because we can move backwards in the string. */" >> $(BROWSER_FILE_DEV)
	echo '        while (regexp.test(name)) {'                                         >> $(BROWSER_FILE_DEV)
	echo '          name = name.replace(regexp, "");'                                  >> $(BROWSER_FILE_DEV)
	echo '        }'                                                                   >> $(BROWSER_FILE_DEV)
	echo ''                                                                            >> $(BROWSER_FILE_DEV)
	echo '        return modules[name];'                                               >> $(BROWSER_FILE_DEV)
	echo '      }'                                                                     >> $(BROWSER_FILE_DEV)
	echo ''                                                                            >> $(BROWSER_FILE_DEV)
	echo '      factory(module, require);'                                             >> $(BROWSER_FILE_DEV)
	echo '      this[name] = module.exports;'                                          >> $(BROWSER_FILE_DEV)
	echo '    }'                                                                       >> $(BROWSER_FILE_DEV)
	echo '  };'                                                                        >> $(BROWSER_FILE_DEV)
	echo ''                                                                            >> $(BROWSER_FILE_DEV)

	for module in $(MODULES); do                                                                \
	  echo "  modules.define(\"$$module\", function(module, require) {" >> $(BROWSER_FILE_DEV); \
	  sed -e 's/^\(..*\)$$/    \1/' lib/$$module.js                     >> $(BROWSER_FILE_DEV); \
	  echo '  });'                                                      >> $(BROWSER_FILE_DEV); \
	  echo ''                                                           >> $(BROWSER_FILE_DEV); \
	done

	echo '  return modules["peg"]' >> $(BROWSER_FILE_DEV)
	echo '})();'                   >> $(BROWSER_FILE_DEV)

	$(UGLIFYJS)                 \
	  --mangle                  \
	  --compress warnings=false \
	  --comments /Copyright/    \
	  -o $(BROWSER_FILE_MIN)    \
	  $(BROWSER_FILE_DEV)

# Remove browser version of the library (created by "browser")
browserclean:
	rm -rf $(BROWSER_DIR)

# Run the spec suite
spec:
	$(JASMINE_NODE) --verbose $(SPEC_DIR)

# Run the benchmark suite
benchmark:
	$(BENCHMARK_RUN)

# Run JSHint on the source
hint:
	$(JSHINT)                                                                \
	  `find $(LIB_DIR) -name '*.js'`                                         \
	  `find $(SPEC_DIR) -name '*.js' -and -not -path '$(SPEC_DIR)/vendor/*'` \
	  $(BENCHMARK_DIR)/*.js                                                  \
	  $(BENCHMARK_RUN)                                                       \
	  $(PEGJS)

.PHONY:  all parser browser browserclean spec benchmark hint
.SILENT: all parser browser browserclean spec benchmark hint
