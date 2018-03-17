#!/usr/bin/env node

"use strict";

const fs = require( "fs" );
const peg = require( "../lib/peg" );
const options = require( "./options" );

// Helpers

function readStream( inputStream, callback ) {

    let input = "";
    inputStream.on( "data", data => {

        input += data;

    } );
    inputStream.on( "end", () => {

        callback( input );

    } );

}

function abort( message ) {

    console.error( message );
    process.exit( 1 );

}

// Main

let inputStream, outputStream;
options.parser = options.parser || {};

if ( options.inputFile === "-" ) {

    process.stdin.resume();
    inputStream = process.stdin;
    inputStream.on( "error", () => {

        abort( `Can't read from file "${ options.inputFile }".` );

    } );

} else {

    inputStream = fs.createReadStream( options.inputFile );
    options.parser.filename = options.inputFile;

}

if ( options.outputFile === "-" ) {

    outputStream = process.stdout;

} else {

    outputStream = fs.createWriteStream( options.outputFile );
    outputStream.on( "error", () => {

        abort( `Can't write to file "${ options.outputFile }".` );

    } );

}

readStream( inputStream, input => {

    let location, source;

    try {

        source = peg.generate( input, options );

    } catch ( e ) {

        if ( typeof e.location === "object" ) {

            location = e.location.start;
            if ( typeof location === "object" ) {

                return abort( location.line + ":" + location.column + ": " + e.message );

            }

        }

        return abort( e.message );

    }

    outputStream.write( source );
    if ( outputStream !== process.stdout ) {

        outputStream.end();

    }

} );
