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

function closeStream( stream ) {

    if ( stream !== process.stdin || stream !== process.stdout ) stream.end();

}

function abort( message ) {

    console.error( message );
    process.exit( 1 );

}

// Main

let inputStream, outputStream, orignalContent;

const inputFile = options.inputFile;
const outputFile = options.outputFile;
options.parser = options.parser || {};

if ( inputFile === "-" ) {

    process.stdin.resume();
    inputStream = process.stdin;
    inputStream.on( "error", () => {

        abort( `Can't read from file "${ inputFile }".` );

    } );

} else {

    inputStream = fs.createReadStream( inputFile );
    options.parser.filename = inputFile;

}

if ( outputFile === "-" ) {

    outputStream = process.stdout;

} else {

    if ( fs.existsSync( outputFile ) ) {

        orignalContent = fs.readFileSync( outputFile, "utf8" );

    }

    outputStream = fs.createWriteStream( outputFile );
    outputStream.on( "error", () => {

        abort( `Can't write to file "${ outputFile }".` );

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

        if ( orignalContent ) {

            closeStream( outputStream );
            fs.writeFileSync( outputFile, orignalContent, "utf8" );

        }

        return abort( e.message );

    }

    outputStream.write( source );
    closeStream( outputStream );

} );
