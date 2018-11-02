#!/usr/bin/env node

//
// Measures impact of a Git commit (or multiple commits) on generated parsers
// speed and size. Makes sense to use only on PEG.js git repository checkout.
//

/* eslint-disable no-mixed-operators, prefer-const */

"use strict";

const child_process = require( "child_process" );
const fs = require( "fs" );
const os = require( "os" );
const path = require( "path" );
const dedent = require( "dedent" );
const glob = require( "glob" );

// Current Working Directory

const cwd = path.join( __dirname, "..", ".." );
if ( process.cwd() !== cwd ) process.chdir( cwd );

// Execution Files

function binfile( ...files ) {

    for ( const file of files ) {

        if ( fs.existsSync( file ) ) return file;

    }

    throw `Could not find: ${ files.join( " || " ) }`;

}

const PEGJS_BIN = binfile( "packages/pegjs/bin/peg.js", "bin/peg.js", "bin/pegjs" );
const BENCHMARK_BIN = binfile( "tools/benchmark/node.js", "test/benchmark/run", "benchmark/run" );

// Utils

function echo( message ) {

    process.stdout.write( message );

}

function print_empty_line() {

    console.log( " " );

}

function exec( command ) {

    return child_process.execSync( command, { encoding: "utf8" } );

}

function prepare( commit ) {

    exec( `git checkout --quiet "${ commit }"` );

}

function runBenchmark() {

    return parseFloat(
        exec( "node " + BENCHMARK_BIN )

            // Split by table seprator, reverse and return the total bytes per second
            .split( "│" )
            .reverse()[ 1 ]

            // Trim the whitespaces and remove ` kB/s` from the end
            .trim()
            .slice( 0, -5 )
    );

}

function measureSpeed() {

    return ( runBenchmark() + runBenchmark() + runBenchmark() + runBenchmark() + runBenchmark() / 5 ).toFixed( 2 );

}

function measureSize() {

    let size = 0;

    glob.sync( "examples/*.pegjs" )
        .forEach( example => {

            exec( `node ${ PEGJS_BIN } ${ example }` );
            example = example.slice( 0, -5 ) + "js";
            size += fs.statSync( example ).size;
            fs.unlinkSync( example );

        } );

    return size;

}

function difference( $1, $2 ) {

    return ( ( $2 / $1 - 1 ) * 100 ).toFixed( 4 );

}

// Prepare

const argv = process.argv.slice( 2 );
let commit_before, commit_after;

if ( argv.length === 1 ) {

    commit_before = argv[ 0 ] + "~1";
    commit_after = argv[ 0 ];

} else if ( argv.length === 2 ) {

    commit_before = argv[ 0 ];
    commit_after = argv[ 1 ];

} else {

    print_empty_line();
    console.log( dedent`

        Usage:

            test/impact <commit>
            test/impact <commit_before> <commit_after>

        Measures impact of a Git commit (or multiple commits) on generated parser's
        speed and size. Makes sense to use only on PEG.js Git repository checkout.

    ` );
    print_empty_line();
    process.exit( 1 );

}

// Measure

const branch = exec( "git rev-parse --abbrev-ref HEAD" );
let speed1, size1, speed2, size2;

print_empty_line();

echo( `Measuring commit ${ commit_before }...` );
prepare( commit_before );
speed1 = measureSpeed();
size1 = measureSize();
echo( " done." + os.EOL );

echo( `Measuring commit ${ commit_after }...` );
prepare( commit_after );
speed2 = measureSpeed();
size2 = measureSize();
echo( " done." + os.EOL );

// Finish

prepare( branch );
print_empty_line();

console.log( dedent`

    test/impact ${ commit_before } ${ commit_after }

    Speed impact
    ------------
    Before:     ${ speed1 } kB/s
    After:      ${ speed2 } kB/s
    Difference: ${ difference( parseFloat( speed1 ), parseFloat( speed2 ) ) }%

    Size impact
    -----------
    Before:     ${ size1 } b
    After:      ${ size2 } b
    Difference: ${ difference( size1, size2 ) }%

    - Measured by /tools/impact with Node.js ${ process.version }
    - Your system: ${ os.type() } ${ os.release() } ${ os.arch() }.

` );
print_empty_line();
