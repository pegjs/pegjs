* Commit history: https://github.com/pegjs/pegjs/commits/master
* Previous changelogs: https://github.com/pegjs/pegjs/tree/master/docs/changelogs
* Contributors this release: https://github.com/pegjs/pegjs/graphs/contributors?from=2016-08-20

> This is a work in progress changelog for the next release _(currently v0.11)_.

### Major Changes

* [Implemented value plucking](https://github.com/pegjs/pegjs/commit/460f0cc5bc9e7b12e7830a13a9afa5026a5f20f4): e.g. When `grammar = "-" @$[a-z]i* "-"` is given `-PEGjs-`, it returns `PEGjs`
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
  - clarify details for the execution environment for actions ([#531](https://github.com/pegjs/pegjs/pull/531))
  - added a clear explanation of balanced braces ([#533](https://github.com/pegjs/pegjs/pull/533))
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
  - reintroduced `offset()` which was removed in a previous release ([#528](https://github.com/pegjs/pegjs/pull/528))
  - added `range()`; returns `[starting offset, current offset]`
  - `location()` also returns a `filename` property if one was passed to the generated parser as an option ([#421](https://github.com/pegjs/pegjs/issues/421))
  - helpers can be disabled via the new `features` option (e.g. `{ text: false }` will remove the `text()` helper)
* Parser returns an instance of the new Grammar class instead of a plain JavaScript object
* Added the ASTVisitor class ([#451](https://github.com/pegjs/pegjs/issues/451))
* Moved all code generation from the `generateBytecode` pass to the `generateJs` pass ([#459](https://github.com/pegjs/pegjs/pull/459))
* Use `.js` files with the `--extra-options-file` (aliased by `-c` and `--config`) option on CLI
* Added the Session API (`peg.compiler.Session`); this should simplify extending PEG.js using plugins
* Implemented warning and error emitters: `session.warn`, `session.error` and `session.fatal` ([#327](https://github.com/pegjs/pegjs/issues/327), [#430](https://github.com/pegjs/pegjs/issues/430), [#431](https://github.com/pegjs/pegjs/issues/431))

### Minor Changes

* Omit PEG.js version from the browser release's filename
* Added support for generating the parser as a ES module using `"format": "es"`
* Added [bundled](https://www.npmjs.com/package/pegjs) TypeScript declaration files for
  - the PEG.js API: `pegjs/typings/api.d.ts`
  - the PEG.js modules: `pegjs/typings/modules.d.ts`
  - generated parsers: `pegjs/typings/generated-parser.d.ts`
* Updated bytecode generator; Generated parsers look slightly better
  - optimize silent fails ([#399](https://github.com/pegjs/pegjs/issues/399))
  - optimize redundant fail checks ([#400](https://github.com/pegjs/pegjs/issues/400))
  - remove unnecessary opcode ([#509](https://github.com/pegjs/pegjs/pull/509))
* Added `ASTVisitor.on.{property,children}`; these are helper's to create visitor's for use with the new ASTVisitor class
* Merged ast utility functions into the new Grammar class; faster and simpler to use now.
* Pass `options.parser` from `peg.generate` to the PEG.js parser (`peg.parser`, or a custom parser)
* Added a pass for the compiler to warn when unused rules are found ([#200](https://github.com/pegjs/pegjs/issues/200))
* Added a `header` option to the compiler; Adds custom comments to the header of the generated parser
* CLI restores original output file (if it already exists) when parser generation fails
* Added the option `extractComments` to the PEG.js parser which if _true_ will extract comments from the grammar ([#511](https://github.com/pegjs/pegjs/pull/511))
* Made the default tracer optional (disabled like so `peg.generate(grammar, { features: { DefaultTracer: false } })`)
* Pass variables to generated parsers through the `context` option when `output: "parser"` ([#517](https://github.com/pegjs/pegjs/issues/517))
* On the CLI added the use of `input` and `output` from the _config file_ instead of passing them as arguments
* Updated examples
* Upgraded support for Unicode (from _v8_ to _v11_)

### Bugfixes

* Report consistent errors on look ahead + cached results (fix's [#452](https://github.com/pegjs/pegjs/issues/452) via [#555](https://github.com/pegjs/pegjs/issues/555))
* Improve error messages ([#194](https://github.com/pegjs/pegjs/issues/194), [#475](https://github.com/pegjs/pegjs/pull/475), [#534](https://github.com/pegjs/pegjs/pull/534), [#547](https://github.com/pegjs/pegjs/pull/547), [#552](https://github.com/pegjs/pegjs/pull/552))
* Do not indent backtick quoted strings in code blocks ([#492](https://github.com/pegjs/pegjs/pull/492))
* Fix shadowing issue for UMD generated parsers ([#499](https://github.com/pegjs/pegjs/issues/499))
* Check rules from `options.allowedStartRules` exist within the grammar ([#524](https://github.com/pegjs/pegjs/issues/524))

### Internal

* Use ESLint to enforce code style
* Switch from Jasmine to Mocha & Chai ([#409](https://github.com/pegjs/pegjs/issues/409))
* Removed Makefile (Had switched to Gulp, but removed that as well); Using the _scripts_ field of `package.json` instead
* Rewrote `tools/impact`; previously a bash script that required external programs, it's now a cross-platform Node script
* Added coverage via [Istanbul](https://www.npmjs.com/package/nyc), [coveralls.io](https://coveralls.io/github/pegjs/pegjs) and [codeclimate.com](https://codeclimate.com/github/pegjs/pegjs) ([#546](https://github.com/pegjs/pegjs/pull/546), [#596](https://github.com/pegjs/pegjs/pull/596))
* Updated spec tests
* Switched to Yarn for workspace based development (_NOTE:_ Yarn should not be required for production use)
* Updated keywords for the [NPM package](https://www.npmjs.com/package/pegjs)
* Moved source code for the [website](https://pegjs.org/) into the main repository; the website is updated as repo is updated now
* Added the [spec](https://pegjs.org/development/test) and [benchmark](https://pegjs.org/development/benchmark) tests to the website
* Switch from [Browserify](https://github.com/browserify/browserify) to [Rollup](https://rollupjs.org/)
* Auto-import PEG.js version using `require("pegjs/package.json")`, and on dist generation use [rollup-plugin-json](https://www.npmjs.com/package/rollup-plugin-json)
* Added https://pegjs.org/development/try; an editor that uses the latest source files for PEG.js
* Replaced [Travis CI support](https://travis-ci.org/pegjs/pegjs/builds) with [Azure Pipelines](https://dev.azure.com/pegjs/pegjs/_build) ([#596](https://github.com/pegjs/pegjs/pull/596))
