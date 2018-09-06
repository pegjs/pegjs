"use strict";

const version = require( "./package" ).version;
const spawn = require( "child_process" ).spawn;
const dest = require( "gulp" ).dest;
const src = require( "gulp" ).src;
const series = require( "gulp" ).series;
const task = require( "gulp" ).task;
const eslint = require( "gulp-eslint" );
const mocha = require( "gulp-mocha" );
const dedent = require( "dedent" );
const browserify = require( "browserify" );
const babelify = require( "babelify" );
const stream = require( "vinyl-source-stream" );
const rename = require( "gulp-rename" );
const buffer = require( "vinyl-buffer" );
const uglify = require( "gulp-uglify" );
const header = require( "gulp-header" );
const del = require( "del" );
const pump = require( "pump" );

function node( args, cb ) {

    spawn( "node", args.split( " " ), { stdio: "inherit" } )

        .on( "error", cb )
        .on( "close", code => {

            if ( ! code ) cb();

        } );

}

// Run ESLint on all JavaScript files.
task( "lint", () => pump(

    src( [
        "**/.*rc.js",
        "bin/*.js",
        "lib/**/*.js",
        "test/benchmark/**/*.js",
        "test/benchmark/run",
        "test/impact",
        "test/spec/**/*.js",
        "src/*.js",
        "gulpfile.js",
        "server.js",
    ] ),
    eslint( { dotfiles: true } ),
    eslint.format(),
    eslint.failAfterError()

) );

// Run tests.
task( "test", () => pump(

    src( "test/spec/**/*.spec.js", { read: false } ),
    mocha()

) );

// Run benchmarks.
task( "benchmark", cb => {

    node( "test/benchmark/run", cb );

} );

// Generate the grammar parser.
task( "build:parser", cb => {

    node( "bin/peg src/parser.pegjs -o lib/parser.js -c src/pegjs.config.js", cb );

} );

// Create the browser build.
task( "build:browser", () => {

    const options = {

        bare: true,
        standalone: "peg",
        suffix: ".min",

    };

    const HEADER = dedent`

        /**
         * PEG.js v${ version }
         * https://pegjs.org/
         *
         * Copyright (c) 2010-2016 David Majda
         * Copyright (c) 2017+ Futago-za Ryuu
         *
         * Released under the MIT License.
         */

        /* eslint-disable */

    `;

    return pump(

        browserify( "lib/peg.js", options )
            .transform( babelify )
            .bundle(),
        stream( "peg.js" ),
        header( HEADER ),
        dest( "browser" ),
        rename( options ),
        buffer(),
        uglify(),
        header( HEADER ),
        dest( "browser" )

    );

} );

// Delete the generated files.
task( "clean", () =>
    del( [ "browser", "examples/*.js" ] )
);

// Default task.
task( "default", series( "lint", "test" ) );
