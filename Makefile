# ===== Directories =====

SRC_DIR       = src
BIN_DIR       = bin
TEST_DIR      = test
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

PACKAGE_JSON_SRC_FILE  = package.json
PACKAGE_JSON_DIST_FILE = $(DIST_NODE_DIR)/package.json

PEGJS_DIST_FILE_DEV = $(DIST_WEB_DIR)/peg-$(PEGJS_VERSION).js
PEGJS_DIST_FILE_MIN = $(DIST_WEB_DIR)/peg-$(PEGJS_VERSION).min.js

CHANGELOG_FILE = CHANGELOG
LICENSE_FILE   = LICENSE
README_FILE    = README.md
VERSION_FILE   = VERSION

# ===== Executables =====

JSHINT        = jshint
UGLIFYJS      = uglifyjs
PEGJS         = $(BIN_DIR)/pegjs
TEST_RUN      = $(TEST_DIR)/run
BENCHMARK_RUN = $(BENCHMARK_DIR)/run

# ===== Variables =====

PEGJS_VERSION = `cat $(VERSION_FILE)`

# ===== Preprocessor =====

# A simple preprocessor that recognizes two directives:
#
#   @VERSION          -- insert PEG.js version
#   @include "<file>" -- include <file> here
#
# This could have been implemented many ways. I chose Perl because everyone will
# have it.
PREPROCESS=perl -e '                                                           \
  use strict;                                                                  \
  use warnings;                                                                \
                                                                               \
  use File::Basename;                                                          \
                                                                               \
  open(my $$f, "$(VERSION_FILE)") or die "Can\x27t open $(VERSION_FILE): $$!"; \
  my $$PEGJS_VERSION = <$$f>;                                                  \
  close($$f);                                                                  \
  chomp($$PEGJS_VERSION);                                                      \
                                                                               \
  sub preprocess {                                                             \
    my $$file = shift;                                                         \
    my $$output = "";                                                          \
                                                                               \
    open(my $$f, $$file) or die "Can\x27t open $$file: $$!";                   \
    while(<$$f>) {                                                             \
      s/\@VERSION/$$PEGJS_VERSION/g;                                           \
                                                                               \
      if (/^\s*\/\/\s*\@include\s*"([^"]*)"\s*$$/) {                           \
        $$output .= preprocess(dirname($$file) . "/" . $$1);                   \
        next;                                                                  \
      }                                                                        \
                                                                               \
      $$output .= $$_;                                                         \
    }                                                                          \
    close($$f);                                                                \
                                                                               \
    return $$output;                                                           \
  }                                                                            \
                                                                               \
  print preprocess($$ARGV[0]);                                                 \
'

# ===== Targets =====

# Generate the grammar parser
parser:
	$(PEGJS) --export-var PEG.parser $(PARSER_SRC_FILE) $(PARSER_OUT_FILE)

# Build the PEG.js library
build:
	mkdir -p $(LIB_DIR)
	$(PREPROCESS) $(PEGJS_SRC_FILE) > $(PEGJS_LIB_FILE)

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
	cp -r               \
	  $(LIB_DIR)        \
	  $(BIN_DIR)        \
	  $(EXAMPLES_DIR)   \
	  $(CHANGELOG_FILE) \
	  $(LICENSE_FILE)   \
	  $(README_FILE)    \
	  $(VERSION_FILE)   \
	  $(DIST_NODE_DIR)
	$(PREPROCESS) $(PACKAGE_JSON_SRC_FILE) > $(PACKAGE_JSON_DIST_FILE)

# Remove distribution file (created by "dist")
distclean:
	rm -rf $(DIST_DIR)

# Run the test suite
test: build
	$(TEST_RUN)

# Run the benchmark suite
benchmark: build
	$(BENCHMARK_RUN)

# Run JSHint on the source
hint: build
	$(JSHINT)                                                                \
	  `find $(SRC_DIR) -name '*.js'`                                         \
	  `find $(TEST_DIR) -name '*.js' -and -not -path '$(TEST_DIR)/vendor/*'` \
	  $(TEST_RUN)                                                            \
	  $(BENCHMARK_DIR)/*.js                                                  \
	  $(BENCHMARK_RUN)                                                       \
	  $(PEGJS)

.PHONY: test benchmark hint parser build clean dist distclean
.SILENT: test benchmark hint parser build clean dist distclean
