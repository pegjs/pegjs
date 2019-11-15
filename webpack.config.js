"use strict";

const target = require( "@pegjs/bundler/target" );
const { VERSION } = require( "pegjs" );

const entry = require.resolve( "pegjs" );
const banner = `

    /**
     * PEG.js v${ VERSION }, [hash]
     * https://pegjs.org/
     *
     * Copyright (c) 2010-2016 David Majda
     * Copyright (c) 2017+ Futago-za Ryuu
     *
     * Released under the MIT License.
     */

    /* eslint-disable */

`;
const library = "peg";

module.exports = [

    /* https://unpkg.com/pegjs@latest/dist/peg.js */
    target( {

        banner,
        entry,
        library,
        output: "packages/pegjs/dist/peg.js",

    } ),

    /* https://unpkg.com/pegjs@latest/dist/peg.min.js */
    target( {

        banner,
        entry,
        library,
        output: "packages/pegjs/dist/peg.min.js",

    } ),

    /* https://unpkg.com/pegjs@dev/dist/*-bundle.min.js */
    target( {

        entry: {
            "benchmark": require.resolve( "@pegjs/benchmark-suite/browser.stub.js" ),
            "test": require.resolve( "@pegjs/spec-suite/browser.stub.js" ),
        },
        library: [ "peg", "[name]" ],
        output: "packages/pegjs/dist/[name]-bundle.min.js",

    } ),

];
