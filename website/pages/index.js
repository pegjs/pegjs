"use strict";

const template = require( "../templates/article" );

module.exports = template( {
    title: "Home",
    content: `

        <div id="sidebar">
            <a class="try" href="online">Try PEG.js online</a>
            <div class="separator">&mdash; or &mdash;</div>
            <pre class="install">npm install pegjs</pre>
            <div class="separator">&mdash; or &mdash;</div>
            <pre class="install">bower install pegjs</pre>
            <div class="separator">&mdash; or &mdash;</div>
            <div class="label">Download browser version</div>
            <span id="download">
                <a
                    title="Download a minified version of PEG.js for the browser"
                    href="https://github.com/pegjs/pegjs/releases/download/v0.10.0/peg-0.10.0.min.js"
                >minified</a>
                |
                <a
                    title="Download PEG.js for the browser"
                    href="https://github.com/pegjs/pegjs/releases/download/v0.10.0/peg-0.10.0.js"
                >development</a>
            </span>
        </div>

        <div id="left-column">
            <p>
                PEG.js is a simple parser generator for JavaScript that produces fast
                parsers with excellent error reporting. You can use it to process complex data
                or computer languages and build transformers, interpreters, compilers and
                other tools easily.
            </p>

        <h2>Features</h2>

        <ul>
            <li>Simple and expressive grammar syntax</li>

            <li>Integrates both lexical and syntactical analysis</li>

            <li>Parsers have excellent error reporting out of the box</li>

            <li>
                Based on <a href="https://en.wikipedia.org/wiki/Parsing_expression_grammar">parsing
                expression grammar</a> formalism &mdash; more powerful than traditional LL(<em>k</em>)
                and LR(<em>k</em>) parsers
            </li>

            <li>
                Usable <a href="https://pegjs.org/online">from your browser</a>, from the command
                line, or via JavaScript API
            </li>
        </ul>
        </div>

    `,
} );
