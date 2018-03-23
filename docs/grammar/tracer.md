### tracer#trace()

Whether you are using the CLI or the API, as long as you pass the `trace` option, the generated parser can trace it's progress by calling `tracer.trace( event )`, which can then be overwritten by passing an alternative tracer in the options to the generated parser.

You can also optionally disable the default tracer by passing `features: { DefaultTracer: false }` to `peg.generate` or `peg.compiler.compile`, in which case a empry function will be called by default unless a tracer is passed to the parser.

The `event` passed to the `trace` method contains the following properties:

property | description
--- | ---
type | name of the event
rule | rule that this event was emitted from
result | the result of the match
location | location in the grammar when the event was emitted

The `type` property will only be 1 of 3 values:

1. `rule.enter` when entering a rule
2. `rule.match` when matching a rule was successful
3. `rule.fail` when matching a rule failed
