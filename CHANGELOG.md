* Commit history: https://github.com/pegjs/pegjs/commits/master
* Previous changelogs: https://github.com/pegjs/pegjs/tree/master/docs/changelogs
* Contributors this release: https://github.com/pegjs/pegjs/graphs/contributors?from=2016-08-20

> This is a work in progress changelog for the next release _(currently v0.11)_.

### Major Changes

* Implemented value plucking (e.g. When `grammar = "-" @$[a-z]i* "-"` is given `-PEGjs-`, it returns `PEGjs`)
* Upgraded JavaScript support:
  - Parser's are generated in ES5
  - Source code for PEG.js and scripts in the repository are written in ES2015, for Node 6+
  - The browser release is in ES5, generated using [Rollup](https://rollupjs.org/) and [Babel](https://babeljs.io/)
  - Dropped support for Node versions _0.x_, _4_ and _non-LTS_ versions (e.g. `5`, `7`, etc)
  - Dropped support for IE versions _8_, _9_ and _10_
* Updated documentation:
  - extracted to separate markdown files in the [docs folder](https://github.com/pegjs/pegjs/tree/master/docs)
  - better explanation about error messages
  - added documentation for case-insensitivity in grammar
  - added documentation for backtracking in grammar
  - clarify details for the execution environment for actions
  - added a clear explanation of balanced braces
  - updated documentation for the JavaScript API
  - added a guide for plugins
  - added documentation for tracer usage
  - added a guide for the CLI
* Rewrote command line tool:
  - added 2 aliases for `--extra-options-file`: `-c` and `--config`
  - options can accept their values via the assignment operator (e.g. `pegjs -c=config.js`)
  - all arguments after `--` are passed to `options["--"]`
  - added aliases for some CLI options; Check them out using `pegjs -h`
  - added "bare" to accepted module formats
* Updated the helpers providable to the generated parsers:
  - added `offset()` (was removed in a previous release)
  - added `range()`; returns `[starting offset, current offset]`
  - `location()` also returns a `filename` property if one was passed to the generated parser as an option
  - helpers can be disabled via the new `features` option (e.g. `{ text: false }` will remove the `text()` helper)
* Parser returns an instance of the new Grammar class instead of a plain JavaScript object
* Added the ASTVisitor class (usable from either `peg.ast.visitor.ASTVisitor` or `session.visitor.ASTVisitor`)
* Moved all code generation from the `generateBytecode` pass to the `generateJs` pass
* Use `.js` files with the `--extra-options-file` (aliased by `-c` and `--config`) option on CLI
* Added the Session API (`peg.compiler.Session`); this should simplify extending PEG.js using plugins

### Minor Changes

* Omit PEG.js version from the browser release's filename
* Added support for generating the parser as a ES module using `"format": "es"`
* Added [bundled](https://www.npmjs.com/package/pegjs) TypeScript declaration files for
  - the PEG.js API: `pegjs/typings/api.d.ts`
  - the PEG.js modules: `pegjs/typings/modules.d.ts`
  - generated parsers: `pegjs/typings/generated-parser.d.ts`
* Simplify bytecode; Generated parsers look slightly better.
* Added `ASTVisitor.on.{property,children}`; these are helper's to create visitor's for use with the new ASTVisitor class
* Merged ast utility functions into the new Grammar class; faster and simpler to use now.
* Pass `options.parser` from `peg.generate` to the PEG.js parser (`peg.parser`, or a custom parser)
* Implemented warning and error emitters (`session.warn`, `session.error` and `session.fatal`)
* Added a pass for the compiler to warn when unused rules are found
* Added a `header` option to the compiler; Adds custom comments to the header of the generated parser
* CLI restores original output file (if it already exists) when parser generation fails
* Added an optional feature to the PEG.js parser to extract comments from grammar if given the option `extractComments`
* Made the default tracer optional (disabled like so `peg.generate(grammar, { features: { DefaultTracer: false } })`)
* Pass variables to generated parsers via the new `context` option (only used when `output: "parser"`)
* On the CLI added the use of `input` and `output` from the _config file_ instead of passing them as arguments
* Updated examples
* Upgraded support for Unicode (from _v8_ to _v11_)

### Bugfixes

* Optimize silent fails ([#399](https://github.com/pegjs/pegjs/issues/399))
* Optimize redundant fail checks ([#400](https://github.com/pegjs/pegjs/issues/400))
* Report consistent errors on look ahead + cached results ([#452](https://github.com/pegjs/pegjs/issues/452))
* Improve error messages ([#475](https://github.com/pegjs/pegjs/pull/475), [#534](https://github.com/pegjs/pegjs/pull/534), [#547](https://github.com/pegjs/pegjs/pull/547), [#552](https://github.com/pegjs/pegjs/pull/552))
* Do not indent backtick quoted strings in code blocks ([#492](https://github.com/pegjs/pegjs/pull/492))
* Fix shadowing issue for UMD generated parsers ([#499](https://github.com/pegjs/pegjs/issues/499))
* Check rules from `options.allowedStartRules` exist within the grammar ([#524](https://github.com/pegjs/pegjs/issues/524))

### Internal

* Use ESLint to enforce code style
* Switch from Jasmine to Mocha & Chai
* Switch from Make to Gulp (`Makefile` -> `gulpfile.js`)
* Rewrote `tools/impact` (a bash script, dependent on external tools) as `test/impact` (a cross-platform Node script)
* Added code coverage ([Istanbul](https://www.npmjs.com/package/nyc) and [coveralls.io](https://coveralls.io/github/pegjs/pegjs))
* Updated spec tests
* Switched to Yarn for workspace based development (_NOTE:_ Yarn should not be required for production use)
* Updated keywords for the [NPM package](https://www.npmjs.com/package/pegjs)
* Moved source code for the [website](https://pegjs.org/) into the main repository; the website is updated as repo is updated now
* Added the [spec](https://pegjs.org/spec) and [benchmark](https://pegjs.org/benchmark) tests to the website
* Switch from [Browserify](https://github.com/browserify/browserify) to [Rollup](https://rollupjs.org/)
* Auto-import PEG.js version using `require("pegjs/package.json")`, and on dist generation use [rollup-plugin-json](https://www.npmjs.com/package/rollup-plugin-json)
* Added https://pegjs.org/development/try; an editor that uses the latest source files for PEG.js
