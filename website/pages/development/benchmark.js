"use strict";

const { Bundler, expand } = require( "../../export.utils" );

const template = require( "../../templates/article" );

module.exports = Bundler.create( {

    script: __filename,
    check: expand( "tools/benchmark" ),
    config: {

        entry: expand( "tools/benchmark/browser.stub.js" ),
        library: [ "peg", "benchmark" ],
        output: expand( "public/js/benchmark-bundle.min.js" ),

    },

    next() {

        return template( {
            title: "Benchmark",
            content: `

                <link rel="stylesheet" href="/css/benchmark.css">

                <div id="options">
                    <label for="run-count">Run each test</label>
                    <input type="text" id="run-count" value="10"> times
                    <input type="checkbox" id="cache">
                    <label for="cache">Use results cache</label>
                    <label for="optimize">Optimize:</label>
                    <select id="optimize">
                        <option value="speed">Speed</option>
                        <option value="size">Size</option>
                    </select>
                    <input type="button" id="run" value="Run">
                </div>

                <table id="results-table">
                    <tr class="columns">
                        <th>Test</th>
                        <th>Input Size</th>
                        <th>Average Parse Time</th>
                        <th>Average Parse Speed</th>
                    </tr>
                    <tr>
                        <td class="no-results" colspan="4">No results available yet.</td>
                    </tr>
                </table>

                <script src="https://unpkg.com/jquery@1.12.4/dist/jquery.min.js"></script>
                <script src="https://unpkg.com/jquery.scrollto@2.1.2/jquery.scrollTo.min.js"></script>
                <script src="/js/benchmark-bundle.min.js"></script>

            `,
        } );

    },

} );
