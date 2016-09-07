# ===== Variables =====

PEGJS_VERSION = `cat $(VERSION_FILE)`

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

MAIN_FILE = $(LIB_DIR)/peg.js

PARSER_SRC_FILE     = $(SRC_DIR)/parser.pegjs
PARSER_OUT_FILE     = $(LIB_DIR)/parser.js
PARSER_OUT_FILE_NEW = $(LIB_DIR)/parser.js.new

BROWSER_FILE_DEV = $(BROWSER_DIR)/peg-$(PEGJS_VERSION).js
BROWSER_FILE_MIN = $(BROWSER_DIR)/peg-$(PEGJS_VERSION).min.js

VERSION_FILE = VERSION

# ===== Executables =====

ESLINT        = $(NODE_MODULES_BIN_DIR)/eslint
BROWSERIFY    = $(NODE_MODULES_BIN_DIR)/browserify
UGLIFYJS      = $(NODE_MODULES_BIN_DIR)/uglifyjs
JASMINE_NODE  = $(NODE_MODULES_BIN_DIR)/jasmine-node
PEGJS         = $(BIN_DIR)/pegjs
BENCHMARK_RUN = $(BENCHMARK_DIR)/run

# ===== Targets =====

# Default target
all: browser

# Generate the grammar parser
parser:
	# We need to prepend ESLint header to the generated parser file because we
	# don't want the various unused variables there to get reported. This is a bit
	# tricky because the file is used when generating its own new version, which
	# means we can't start writing the header there until we call $(PEGJS).

	$(PEGJS) -o $(PARSER_OUT_FILE_NEW) $(PARSER_SRC_FILE)

	rm -f $(PARSER_OUT_FILE)

	echo '/* eslint-env node, amd */'     >> $(PARSER_OUT_FILE)
	echo '/* eslint no-unused-vars: 0 */' >> $(PARSER_OUT_FILE)
	echo                                  >> $(PARSER_OUT_FILE)
	cat $(PARSER_OUT_FILE_NEW)            >> $(PARSER_OUT_FILE)

	rm $(PARSER_OUT_FILE_NEW)

# Build the browser version of the library
browser:
	mkdir -p $(BROWSER_DIR)

	rm -f $(BROWSER_FILE_DEV)
	rm -f $(BROWSER_FILE_MIN)

	echo '/*'                                                                          >> $(BROWSER_FILE_DEV)
	echo " * PEG.js $(PEGJS_VERSION)"                                                  >> $(BROWSER_FILE_DEV)
	echo ' *'                                                                          >> $(BROWSER_FILE_DEV)
	echo ' * http://pegjs.org/'                                                        >> $(BROWSER_FILE_DEV)
	echo ' *'                                                                          >> $(BROWSER_FILE_DEV)
	echo ' * Copyright (c) 2010-2016 David Majda'                                      >> $(BROWSER_FILE_DEV)
	echo ' * Licensed under the MIT license.'                                          >> $(BROWSER_FILE_DEV)
	echo ' */'                                                                         >> $(BROWSER_FILE_DEV)

	$(BROWSERIFY)                                                   \
		--standalone peg                                              \
		--transform [ babelify --presets [ es2015 ] --compact false ] \
		$(MAIN_FILE) >> $(BROWSER_FILE_DEV)

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

# Run ESLint on the source
lint:
	$(ESLINT)                                                                \
	  `find $(LIB_DIR) -name '*.js'`                                         \
	  `find $(SPEC_DIR) -name '*.js' -and -not -path '$(SPEC_DIR)/vendor/*'` \
	  $(BENCHMARK_DIR)/*.js                                                  \
	  $(BENCHMARK_RUN)                                                       \
	  $(PEGJS)

.PHONY:  all parser browser browserclean spec benchmark lint
.SILENT: all parser browser browserclean spec benchmark lint
