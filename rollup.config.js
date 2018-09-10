"use strict";

const dedent = require( "dedent" );
const babel = require( "rollup-plugin-babel" );
const commonjs = require( "rollup-plugin-commonjs" );
const resolve = require( "rollup-plugin-node-resolve" );
const { terser } = require( "rollup-plugin-terser" );

const HEADER = dedent`

    /**
     * PEG.js v${ require( "pegjs" ).VERSION }
     * https://pegjs.org/
     *
     * Copyright (c) 2010-2016 David Majda
     * Copyright (c) 2017+ Futago-za Ryuu
     *
     * Released under the MIT License.
     */

    /* eslint-disable */

`;

const babelOptions = require( "./.babelrc" );
babelOptions.babelrc = false;
babelOptions.runtimeHelpers = true;

function generate( target ) {

    const config = {
        input: "packages/pegjs/lib/peg.js",
        output: {
            file: `packages/pegjs/dist/${ target }`,
            format: "umd",
            name: "PEG",
            banner: HEADER,
        },
        onwarn( warning, warn ) {

            if ( warning.code !== "EVAL" ) warn( warning );

        },
        plugins: [
            commonjs(),
            babel( babelOptions ),
            resolve(),
        ],
    };

    if ( target.includes( ".min" ) )

        config.plugins.push( terser( { output: { comments: /MIT License/ } } ) );

    return config;

}

module.exports = [

    // es5 release
    generate( "peg.js" ),

    // es5 release (minified)
    generate( "peg.min.js" ),

];
