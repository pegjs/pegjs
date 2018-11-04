#!/usr/bin/env node

"use strict";

const bundle = require( "./index" );
const dedent = require( "dedent" );
const peg = require( "pegjs" );

const HEADER = dedent`

    /**
     * PEG.js v${ peg.VERSION }
     * https://pegjs.org/
     *
     * Copyright (c) 2010-2016 David Majda
     * Copyright (c) 2017+ Futago-za Ryuu
     *
     * Released under the MIT License.
     */

    /* eslint-disable */

`;

function generate( target ) {

    bundle( {

        banner: HEADER,
        format: "umd",
        name: "peg",
        source: "packages/pegjs/lib/peg.js",
        target: `packages/pegjs/dist/${ target }`,
        silent: process.argv.includes( "-s" ),

    } );

}

// es5 release
generate( "peg.js" );

// es5 release (minified)
generate( "peg.min.js" );
