"use strict";

const version = require( "./package" ).version;
const spawn = require( "child_process" ).spawn;
const gulp = require( "gulp" );
const task = gulp.task.bind( gulp );
const eslint = require( "gulp-eslint" );
const mocha = require( "gulp-mocha" );
const dedent = require( "dedent" );
const browserify = require( "browserify" );
const babelify = require( "babelify" );
const source = require( "vinyl-source-stream" );
const rename = require( "gulp-rename" );
const buffer = require( "vinyl-buffer" );
const uglify = require( "gulp-uglify" );
const header = require( "gulp-header" );
const del = require( "del" );
const runSequence = require( "run-sequence" );

function node( args ) {

    return spawn( "node", args.split( " " ), { stdio: "inherit" } );

}

// Run ESLint on all JavaScript files.
task( "lint", () => gulp
    .src( [
        "**/.*rc.js",
        "lib/**/*.js",
        "!lib/parser.js",
        "test/benchmark/**/*.js",
        "test/benchmark/run",
        "test/impact",
        "test/spec/**/*.js",
        "test/server/run",
        "bin/*.js",
        "gulpfile.js"
    ] )
    .pipe( eslint( { dotfiles: true } ) )
    .pipe( eslint.format() )
    .pipe( eslint.failAfterError() )
);

// Run tests.
task( "test", () => gulp
    .src( "test/spec/**/*.spec.js", { read: false } )
    .pipe( mocha() )
);

// Run benchmarks.
task( "benchmark", () => node( "test/benchmark/run" ) );

// Generate the grammar parser.
task( "build:parser", () =>
    node( "bin/peg src/parser.pegjs -o lib/parser.js -c src/config.json" )
);

// Create the browser build.
task( "build:browser", () => {

    const HEADER = dedent`

        /**
         * PEG.js v${ version }
         * https://pegjs.org/
         *
         * Copyright (c) 2010-2016 David Majda
         * Copyright (c) 2017+ Futago-za Ryuu
         *
         * Released under the MIT License.
         */\n\n

    `;

    return browserify( "lib/peg.js", { standalone: "peg" } )
        .transform( babelify, { presets: "env", compact: false } )
        .bundle()
        .pipe( source( "peg.js" ) )
        .pipe( header( HEADER ) )
        .pipe( gulp.dest( "browser" ) )
        .pipe( rename( { suffix: ".min" } ) )
        .pipe( buffer() )
        .pipe( uglify() )
        .pipe( header( HEADER ) )
        .pipe( gulp.dest( "browser" ) );

} );

// Delete the generated files.
task( "clean", () =>
    del( [ "browser", "examples/*.js" ] )
);

// Default task.
task( "default", cb =>
    runSequence( "lint", "test", cb )
);
