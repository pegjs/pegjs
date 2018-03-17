## JavaScript API

In Node.js, require the PEG.js module:

```js
// ES2015+ Module System
import peg from "pegjs";

// CommonJS
var peg = require("pegjs");
```

In browsers, include the PEG.js library in your web page or application using the `<script>` tag. If PEG.js detects an AMD loader, it will define itself as a module, otherwise the API will be available in the `peg` global object.

After this there are 3 methods and 1 class that you will mainly use:

```js
var grammar = "start = ('a' / 'b')+";
var passes = [ /* check, transform and generate passes */ ];
var parser, session, ast;

ast = peg.parser.parse(grammar);
session = new peg.Session( { grammar, passes } );
parser = peg.compiler.compile(ast, session);
parser = peg.generate(grammar);
```

The most common method you will use is `peg.generate()`, which is the API alternative to the [PEG.js CLI](./generating-a-parser.md). More about each method is explained below, along with their respective options.

#### peg.parser.parse(input[, options])

You can simply parse a grammar and get it's AST by using the parser:

```js
var ast = peg.parser.parse("start = ('a' / 'b')+");
```

The following option's are used by the PEG.js parser:

  * `extractComments` - If `true`, the parser will collect all comments in the grammar (default: `false`).
  * `reservedWords` - An array of words that the parser wont allow as labels for rules (default: [ES5](http://es5.github.io/#x7.6.1)).

When `extractComments` is set to `true`, the parser will collect all comments in the grammar and return them on the `comments` property (as an object map) on the `grammar` AST node (the AST directly returned by the parser). Each comment property has it's offset as the property key, while the property value has the following structure:

```js
{
  text: 'all text between /* or */, or // and end of line',
  multiline: true|false,
  location: location()
}
```

When set to `false`, the `comments` property will be set to `null`.

For more information about `location()`, as well more methods you can use in JavaScript actions within your grammar, see the helper's description in [Action Execution Environment](../grammar/action-execution-environment.md).

#### new peg.compiler.Session([options])

An instance of this class holds helpers (methods, objects with methods, constants, etc) that are shared between multiple calls to `peg.compiler.compile()`.

> This approach is used rather then a traditional compiler class because it provides the plugin developer with an easier way to replace certain components rather then creating their own version of PEG.js to override one or more internal methods.

The following option's are used by the Session API, but are currently all optional:

  * `grammar` - The input that was parsed (source for the PEG.js AST passed to the compiler and the current passes).
  * `opcodes` - An `enum` like hashmap (plain object) that is used by the bytecode and parser generators.
  * `parser` - A pre-generated PEG.js grammar parser that should return an instance of the PEG.js AST's Grammar class. Can be replaced to add additional syntax features, or allow an alternative syntax for the grammar.
  * `passes` - An object with each property being an array of methods that will check or alter the AST passed to them.
  * `visitor` - An object that should contain the `ASTVisitor` class for the PEG.js AST, as well as the `build()` helper.
  * `vm` - An object that should contain `runInContext()`, a wrapper for `eval` based on Node's `vm.runInContext()` method.
  * `warn` - A method called only when PEG.js encounters an error that doesn't stop the parser from being generated.
  * `error` - A method that will be called when PEG.js encounters an error that will stop the parser from being generated.

This class will also return some helper methods:

  * `parse( input, options )` - an alias for `this.parser.parse( input, options )`
  * `buildVisitor( functions )` - an alias for `this.visitor.build( functions )`

#### peg.compiler.compile(ast, session[, options])

This method takes a parsed grammar (the PEG.js AST), sets default options, executes each pass currently within the session (passing the _ast_, _session_ and _options_ arguments to each one), then returns the result, which depends on the value of the `output` option.

```js
var grammar = "start = ('a' / 'b')+";
var ast = peg.parser.parse(grammar);
var passes = peg.util.convertPasses( peg.compiler.passes );
var session = new peg.Session( { grammar, passes } );
var parser = peg.compiler.compile(ast, session);
```

You can tweak the generated parser by passing a third parameter with an options object. The following options are supported:

Option | default value | description
--- | --- | ---
allowedStartRules | first rule | rules the generated parser is allowed to start parsing from
cache | `false` | makes the generated parser cache results, avoiding exponential parsing time in pathological cases but making the parser slower
context | `{}` | contains a map of variables used by `peg.util.vm.runInContext()` when the `output` option is set to `"parser"`
dependencies | `{}` | parser dependencies, the value is an object which maps variables used to access the dependencies to module IDs used to load them; valid only when `format` is set to `"amd"`, `"commonjs"`, `"es"`, or `"umd"`
exportVar | `null` | name of an optional global variable into which the generated parser object is assigned to when no module loader is detected; valid only when `format` is set to `"globals"` or `"umd"`
features | `null` | map of optional features that are set to `true` by default: `"text"`, `"offset"`, `"range"`, `"location"`, `"expected"`, `"error"` and `"filename"`
format | `"bare"` | format of the generated parser (`"amd"`, `"bare"`, `"commonjs"`, `"es"`, `"globals"`, or `"umd"`); valid only when `output` is set to `"source"`
header | `null` | adds additional comments or content after the `Generated by ...` comment; this option is only handled if it's an array or a string:
optimize | `"speed"` | selects between optimizing the generated parser for parsing speed (`"speed"`) or code size (`"size"`)
output | `"parser"` | if set to `"parser"`, the method will return generated parser object; if set to `"source"`, it will return generated parser source code as a string
trace | `false` | makes the generated parser trace its progress

The `header` options behavior will change depending on the option type:
* `[ string1, string2, ... ]` will add each element (all expected to be strings) as a separate line comment
* `string` will simply append the string (e.g. `"/* eslint-disable */"`) after the `Generated by ...` comment

#### peg.generate(grammar[, options])

Will generate a parser from the given grammar (the _input_ passed to `peg.parser.parse()`):

```js
var parser = peg.generate("start = ('a' / 'b')+");
```

This method will return a generated parser object or its source code as a string (depending on the value of the `output` option - see above). It will throw an exception if the grammar is invalid. The exception will contain the usual `message` property with more details about the error, along with a `location` property to track the location of the error. You can easily tell if the exception was thrown by PEG.js because it will always have the `name` property set to `GrammarError`.

You can tweak the generated parser by passing a second parameter with an options object to `peg.generate()`. The following options are supported:

  * All options that you pass to `peg.compiler.compile()`
  * `parser` - an optional object with option's passed to the PEG.js parser (`peg.parser.parse()`)
  * `plugins` - plugins to use _(their `use()` method is executed by `peg.generate()`)_
