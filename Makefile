# ===== Variables =====

PEGJS_VERSION = `cat $(VERSION_FILE)`

# ===== Modules =====

# Order matters -- dependencies must be listed before modules dependent on them.
MODULES = utils                                 \
          grammar-error                         \
          parser                                \
          compiler/passes/allocate-registers    \
          compiler/passes/generate-code         \
          compiler/passes/remove-proxy-rules    \
          compiler/passes/report-left-recursion \
          compiler/passes/report-missing-rules  \
          compiler/passes                       \
          compiler                              \
          peg

# ===== Directories =====

SRC_DIR       = src
BIN_DIR       = bin
SPEC_DIR      = spec
BENCHMARK_DIR = benchmark
EXAMPLES_DIR  = examples
LIB_DIR       = lib
DIST_DIR      = dist
DIST_WEB_DIR  = $(DIST_DIR)/web
DIST_NODE_DIR = $(DIST_DIR)/node

# ===== Files =====

PARSER_SRC_FILE = $(SRC_DIR)/parser.pegjs
PARSER_OUT_FILE = $(SRC_DIR)/parser.js

PEGJS_SRC_FILE = $(SRC_DIR)/peg.js
PEGJS_LIB_FILE = $(LIB_DIR)/peg.js

PEGJS_DIST_FILE_DEV = $(DIST_WEB_DIR)/peg-$(PEGJS_VERSION).js
PEGJS_DIST_FILE_MIN = $(DIST_WEB_DIR)/peg-$(PEGJS_VERSION).min.js

PACKAGE_JSON_FILE = package.json
CHANGELOG_FILE    = CHANGELOG
LICENSE_FILE      = LICENSE
README_FILE       = README.md
VERSION_FILE      = VERSION

# ===== Executables =====

JSHINT        = jshint
UGLIFYJS      = uglifyjs
JASMINE_NODE  = jasmine-node
PEGJS         = $(BIN_DIR)/pegjs
BENCHMARK_RUN = $(BENCHMARK_DIR)/run

# ===== Targets =====

# Generate the grammar parser
parser:
	$(PEGJS) $(PARSER_SRC_FILE) $(PARSER_OUT_FILE)

# Build the PEG.js library
build:
	mkdir -p $(LIB_DIR)
	rm -f $(PEGJS_LIB_FILE)

	# The following code is inspired by CoffeeScript's Cakefile.

	echo '/*'                                                                          >> $(PEGJS_LIB_FILE)
	echo " * PEG.js $(PEGJS_VERSION)"                                                  >> $(PEGJS_LIB_FILE)
	echo ' *'                                                                          >> $(PEGJS_LIB_FILE)
	echo ' * http://pegjs.majda.cz/'                                                   >> $(PEGJS_LIB_FILE)
	echo ' *'                                                                          >> $(PEGJS_LIB_FILE)
	echo ' * Copyright (c) 2010-2012 David Majda'                                      >> $(PEGJS_LIB_FILE)
	echo ' * Licensed under the MIT license'                                           >> $(PEGJS_LIB_FILE)
	echo ' */'                                                                         >> $(PEGJS_LIB_FILE)
	echo 'var PEG = (function(undefined) {'                                            >> $(PEGJS_LIB_FILE)
	echo '  var modules = {'                                                           >> $(PEGJS_LIB_FILE)
	echo '    define: function(name, factory) {'                                       >> $(PEGJS_LIB_FILE)
	echo '      var dir    = name.replace(/(^|\/)[^/]+$$/, "$$1"),'                    >> $(PEGJS_LIB_FILE)
	echo '          module = { exports: {} };'                                         >> $(PEGJS_LIB_FILE)
	echo ''                                                                            >> $(PEGJS_LIB_FILE)
	echo '      function require(path) {'                                              >> $(PEGJS_LIB_FILE)
	echo '        var name   = dir + path,'                                            >> $(PEGJS_LIB_FILE)
	echo '            regexp = /[^\/]+\/\.\.\/|\.\//;'                                 >> $(PEGJS_LIB_FILE)
	echo ''                                                                            >> $(PEGJS_LIB_FILE)
	echo "        /* Can't use /.../g because we can move backwards in the string. */" >> $(PEGJS_LIB_FILE)
	echo '        while (regexp.test(name)) {'                                         >> $(PEGJS_LIB_FILE)
	echo '          name = name.replace(regexp, "");'                                  >> $(PEGJS_LIB_FILE)
	echo '        }'                                                                   >> $(PEGJS_LIB_FILE)
	echo ''                                                                            >> $(PEGJS_LIB_FILE)
	echo '        return modules[name];'                                               >> $(PEGJS_LIB_FILE)
	echo '      }'                                                                     >> $(PEGJS_LIB_FILE)
	echo ''                                                                            >> $(PEGJS_LIB_FILE)
	echo '      factory(module, require);'                                             >> $(PEGJS_LIB_FILE)
	echo '      this[name] = module.exports;'                                          >> $(PEGJS_LIB_FILE)
	echo '    }'                                                                       >> $(PEGJS_LIB_FILE)
	echo '  };'                                                                        >> $(PEGJS_LIB_FILE)
	echo ''                                                                            >> $(PEGJS_LIB_FILE)

	for module in $(MODULES); do                                                              \
	  echo "  modules.define(\"$$module\", function(module, require) {" >> $(PEGJS_LIB_FILE); \
	  sed -e 's/^/    /' src/$$module.js                                >> $(PEGJS_LIB_FILE); \
	  echo '  });'                                                      >> $(PEGJS_LIB_FILE); \
	  echo ''                                                           >> $(PEGJS_LIB_FILE); \
	done

	echo '  return modules["peg"]'              >> $(PEGJS_LIB_FILE)
	echo '})();'                                >> $(PEGJS_LIB_FILE)
	echo ''                                     >> $(PEGJS_LIB_FILE)
	echo 'if (typeof module !== "undefined") {' >> $(PEGJS_LIB_FILE)
	echo '  module.exports = PEG;'              >> $(PEGJS_LIB_FILE)
	echo '}'                                    >> $(PEGJS_LIB_FILE)

# Remove built PEG.js library (created by "build")
clean:
	rm -rf $(LIB_DIR)

# Prepare dstribution files
dist: build
	# Web
	mkdir -p $(DIST_WEB_DIR)
	cp $(PEGJS_LIB_FILE) $(PEGJS_DIST_FILE_DEV)
	$(UGLIFYJS) --ascii -o $(PEGJS_DIST_FILE_MIN) $(PEGJS_LIB_FILE)

	# Node.js
	mkdir -p $(DIST_NODE_DIR)
	cp -r                  \
	  $(LIB_DIR)           \
	  $(BIN_DIR)           \
	  $(EXAMPLES_DIR)      \
	  $(PACKAGE_JSON_FILE) \
	  $(CHANGELOG_FILE)    \
	  $(LICENSE_FILE)      \
	  $(README_FILE)       \
	  $(VERSION_FILE)      \
	  $(DIST_NODE_DIR)

# Remove distribution file (created by "dist")
distclean:
	rm -rf $(DIST_DIR)

# Run the spec suite
spec: build
	$(JASMINE_NODE) --verbose $(SPEC_DIR)

# Run the benchmark suite
benchmark: build
	$(BENCHMARK_RUN)

# Run JSHint on the source
hint: build
	$(JSHINT)                                                                \
	  `find $(SRC_DIR) -name '*.js'`                                         \
	  `find $(SPEC_DIR) -name '*.js' -and -not -path '$(SPEC_DIR)/vendor/*'` \
	  $(BENCHMARK_DIR)/*.js                                                  \
	  $(BENCHMARK_RUN)                                                       \
	  $(PEGJS)

.PHONY: spec benchmark hint parser build clean dist distclean
.SILENT: spec benchmark hint parser build clean dist distclean
