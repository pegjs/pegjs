## Plugins

You can use plugins by simply passing them to the generate method (e.g. [`peg.generate(grammar, { plugins: [plugin1, plugin2, etc] })`](./javascript-api.md#peggenerategrammar-options)).


#### Creating a Plugin

Plugins are expected to be an object that contains at least one method: `use( session, options )`

- `session` - See the docs for [peg.compiler.Session](./javascript-api.md#new-pegcompilersessionoptions)
- `options` - see the docs for [`peg.generate`](./javascript-api.md#peggenerategrammar-options) and [`peg.compiler.compile`](./javascript-api.md#pegcompilercompileast-session-options)

Here is a simple example:

```js
import customGrammarParser from "./parser";

export function use( session, options ) {

    // Replace the grammar parser
    config.parser = customGrammarParser;

    // always output the source
    options.output = "source";

}
```

#### Resources

You can find some plugins to use on

- the [PEG.js wiki](https://github.com/pegjs/pegjs/wiki/Plugins) (or add yours to the list for other's to find)
- NPM: https://www.npmjs.com/browse/keyword/pegjs
