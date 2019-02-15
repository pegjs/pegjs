"use strict";

const target = require( "@pegjs/bundler/target" );

module.exports = [

    /* https://unpkg.com/pegjs@latest/dist/peg.js */
    target( {

        entry: require.resolve( "pegjs" ),
        library: "peg",
        output: "packages/pegjs/dist/peg.js",

    } ),

    /* https://unpkg.com/pegjs@latest/dist/peg.min.js */
    target( {

        entry: require.resolve( "pegjs" ),
        library: "peg",
        output: "packages/pegjs/dist/peg.min.js",

    } ),

    /* https://unpkg.com/pegjs@dev/dist/*-bundle.min.js */
    target( {

        entry: {
            "benchmark": require.resolve( "@pegjs/benchmark-suite/browser.js" ),
            "test": require.resolve( "@pegjs/spec-suite/browser.stub.js" ),
        },
        library: [ "peg", "[name]" ],
        output: "packages/pegjs/dist/[name]-bundle.min.js",

    } ),

];
