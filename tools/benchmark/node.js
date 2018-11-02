#!/usr/bin/env node

"use strict";

const Runner = require( "./runner.js" );
const benchmarks = require( "./benchmarks.js" );
const fs = require( "fs" );
const path = require( "path" );

// Results Table Manipulation

function dup( text, count ) {

    let result = "";

    for ( let i = 1; i <= count; i++ ) result += text;

    return result;

}

function padLeft( text, length ) {

    return dup( " ", length - text.length ) + text;

}

function padRight( text, length ) {

    return text + dup( " ", length - text.length );

}

function center( text, length ) {

    const padLength = ( length - text.length ) / 2;

    return dup( " ", Math.floor( padLength ) )
         + text
         + dup( " ", Math.ceil( padLength ) );

}

function writeTableHeader() {

    console.log( "┌─────────────────────────────────────┬───────────┬────────────┬──────────────┐" );
    console.log( "│                Test                 │ Inp. size │ Avg. time  │  Avg. speed  │" );

}

function writeHeading( heading ) {

    console.log( "├─────────────────────────────────────┴───────────┴────────────┴──────────────┤" );
    console.log( "│ " + center( heading, 75 ) + " │" );
    console.log( "├─────────────────────────────────────┬───────────┬────────────┬──────────────┤" );

}

function writeResult( title, inputSize, parseTime ) {

    const KB = 1024;
    const MS_IN_S = 1000;

    console.log(
        "│ " +
        padRight( title, 35 ) +
        " │ " +
        padLeft( ( inputSize / KB ).toFixed( 2 ), 6 ) +
        " kB │ " +
        padLeft( parseTime.toFixed( 2 ), 7 ) +
        " ms │ " +
        padLeft( ( ( inputSize / KB ) / ( parseTime / MS_IN_S ) ).toFixed( 2 ), 7 ) +
        " kB/s │"
    );

}

function writeSeparator() {

    console.log( "├─────────────────────────────────────┼───────────┼────────────┼──────────────┤" );

}

function writeTableFooter() {

    console.log( "└─────────────────────────────────────┴───────────┴────────────┴──────────────┘" );

}

// Helpers

function printHelp() {

    console.log( "Usage: run [options]" );
    console.log( "" );
    console.log( "Runs PEG.js benchmark suite." );
    console.log( "" );
    console.log( "Options:" );
    console.log( "  -n, --run-count <n>          number of runs (default: 10)" );
    console.log( "      --cache                  make tested parsers cache results" );
    console.log( "  -o, --optimize <goal>        select optimization for speed or size (default:" );
    console.log( "                               speed)" );

}

function exitSuccess() {

    process.exit( 0 );

}

function exitFailure() {

    process.exit( 1 );

}

function abort( message ) {

    console.error( message );
    exitFailure();

}

// Arguments

const args = process.argv.slice( 2 ); // Trim "node" and the script path.

function isOption( arg ) {

    return ( /^-/ ).test( arg );

}

function nextArg() {

    args.shift();

}

// Main

let runCount = 10;
const options = {
    cache: false,
    optimize: "speed"
};

while ( args.length > 0 && isOption( args[ 0 ] ) ) {

    switch ( args[ 0 ] ) {

        case "-n":
        case "--run-count":
            nextArg();
            if ( args.length === 0 ) {

                abort( "Missing parameter of the -n/--run-count option." );

            }
            runCount = parseInt( args[ 0 ], 10 );
            if ( isNaN( runCount ) || runCount <= 0 ) {

                abort( "Number of runs must be a positive integer." );

            }
            break;

        case "--cache":
            options.cache = true;
            break;

        case "-o":
        case "--optimize":
            nextArg();
            if ( args.length === 0 ) {

                abort( "Missing parameter of the -o/--optimize option." );

            }
            if ( args[ 0 ] !== "speed" && args[ 0 ] !== "size" ) {

                abort( "Optimization goal must be either \"speed\" or \"size\"." );

            }
            options.optimize = args[ 0 ];
            break;

        case "-h":
        case "--help":
            printHelp();
            exitSuccess();
            break;

        default:
            abort( "Unknown option: " + args[ 0 ] + "." );

    }
    nextArg();

}

if ( args.length > 0 ) {

    abort( "No arguments are allowed." );

}

Runner.run( benchmarks, runCount, options, {

    readFile( file ) {

        if ( file.startsWith( "benchmark" ) ) file = path.join( "tools", file );

        return fs.readFileSync( file, "utf8" );

    },

    testStart() {

        // Nothing to do.

    },

    testFinish( benchmark, test, inputSize, parseTime ) {

        writeResult( test.title, inputSize, parseTime );

    },

    benchmarkStart( benchmark ) {

        writeHeading( benchmark.title );

    },

    benchmarkFinish( benchmark, inputSize, parseTime ) {

        writeSeparator();
        writeResult( benchmark.title + " total", inputSize, parseTime );

    },

    start() {

        writeTableHeader();

    },

    finish( inputSize, parseTime ) {

        writeSeparator();
        writeResult( "Total", inputSize, parseTime );
        writeTableFooter();

    },

} );
