"use strict";

const fs = require( "fs" );
const path = require( "path" );
const peg = require( "../lib/peg" );
const util = peg.util;

// Options

let inputFile = null;
let outputFile = null;
let options = {
    "--": [],
    "cache": false,
    "dependencies": {},
    "exportVar": null,
    "format": "commonjs",
    "optimize": "speed",
    "output": "source",
    "parser": {},
    "plugins": [],
    "trace": false,
};

const EXPORT_VAR_FORMATS = [ "globals", "umd" ];
const DEPENDENCY_FORMATS = [ "amd", "commonjs", "es", "umd" ];
const MODULE_FORMATS = [ "amd", "bare", "commonjs", "es", "globals", "umd" ];
const OPTIMIZATION_GOALS = [ "size", "speed" ];

// Helpers

function abort( message ) {

    console.error( message );
    process.exit( 1 );

}

function addExtraOptions( config ) {

    if ( typeof config === "string" ) {

        try {

            config = JSON.parse( config );

        } catch ( e ) {

            if ( ! ( e instanceof SyntaxError ) ) throw e;
            abort( "Error parsing JSON: " + e.message );

        }

    }
    if ( typeof config !== "object" ) {

        abort( "The JSON with extra options has to represent an object." );

    }

    if ( config.input !== null || config.output !== null ) {

        // We don't want to touch the orignal config, just in case it comes from
        // a javascript file, in which case its possible the same object is used
        // for something else, somewhere else.
        config = util.clone( config );
        const { input, output } = config;

        if ( input !== null ) {

            if ( typeof input !== "string" )

                abort( "The option `input` must be a string." );

            if ( inputFile !== null )

                abort( `The input file is already set, cannot use: "${ input }".` );

            inputFile = input;
            delete config.input;

        }

        if ( output !== null ) {

            if ( typeof output !== "string" )

                abort( "The option `output` must be a string." );

            outputFile = output;
            delete config.output;

        }

    }

    options = util.processOptions( config, options );

}

function formatChoicesList( list ) {

    list = list.map( entry => `"${ entry }"` );
    const lastOption = list.pop();

    return list.length === 0
        ? lastOption
        : list.join( ", " ) + " or " + lastOption;

}

function updateList( list, string ) {

    string
        .split( "," )
        .forEach( entry => {

            entry = entry.trim();
            if ( list.indexOf( entry ) === -1 ) {

                list.push( entry );

            }

        } );

}

// Arguments

let args = process.argv.slice( 2 );

function nextArg( option ) {

    if ( args.length === 0 ) {

        abort( `Missing parameter of the ${ option } option.` );

    }
    return args.shift();

}

// Parse Arguments

while ( args.length > 0 ) {

    let config, mod;
    let argument = args.shift();

    if ( argument.indexOf( "-" ) === 0 && argument.indexOf( "=" ) > 1 ) {

        argument = argument.split( "=" );
        args.unshift( argument.length > 2 ? argument.slice( 1 ) : argument[ 1 ] );
        argument = argument[ 0 ];

    }

    switch ( argument ) {

        case "--":
            options[ "--" ] = args;
            args = [];
            break;

        case "-a":
        case "--allowed-start-rules":
            if ( ! options.allowedStartRules ) options.allowedStartRules = [];
            updateList( options.allowedStartRules, nextArg( "--allowed-start-rules" ) );
            break;

        case "--cache":
            options.cache = true;
            break;

        case "--no-cache":
            options.cache = false;
            break;

        case "-d":
        case "--dependency":
            argument = nextArg( "-d/--dependency" );
            mod = argument.split( ":" );

            if ( mod.length === 1 ) mod = [ argument, argument ];
            else if ( mod.length > 2 ) mod[ 1 ] = mod.slice( 1 );

            options.dependencies[ mod[ 0 ] ] = mod[ 1 ];
            break;

        case "-e":
        case "--export-var":
            options.exportVar = nextArg( "-e/--export-var" );
            break;

        case "--extra-options":
            addExtraOptions( nextArg( "--extra-options" ) );
            break;

        case "-c":
        case "--config":
        case "--extra-options-file":
            argument = nextArg( "-c/--config/--extra-options-file" );
            if ( path.extname( argument ) === ".js" ) {

                config = require( path.resolve( argument ) );

            } else {

                try {

                    config = fs.readFileSync( argument, "utf8" );

                } catch ( e ) {

                    abort( `Can't read from file "${ argument }".` );

                }

            }
            addExtraOptions( config );
            break;

        case "-f":
        case "--format":
            argument = nextArg( "-f/--format" );
            if ( MODULE_FORMATS.indexOf( argument ) === -1 ) {

                abort( `Module format must be either ${ formatChoicesList( MODULE_FORMATS ) }.` );

            }
            options.format = argument;
            break;

        case "-h":
        case "--help":
            console.log( require( "./usage" ) );
            process.exit();
            break;

        case "-O":
        case "--optimize":
            argument = nextArg( "-O/--optimize" );
            if ( OPTIMIZATION_GOALS.indexOf( argument ) === -1 ) {

                abort( `Optimization goal must be either ${ formatChoicesList( OPTIMIZATION_GOALS ) }.` );

            }
            options.optimize = argument;
            break;

        case "-o":
        case "--output":
            outputFile = nextArg( "-o/--output" );
            break;

        case "-p":
        case "--plugin":
            argument = nextArg( "-p/--plugin" );
            try {

                mod = require( argument );

            } catch ( ex1 ) {

                if ( ex1.code !== "MODULE_NOT_FOUND" ) throw ex1;
                try {

                    mod = require( path.resolve( argument ) );

                } catch ( ex2 ) {

                    if ( ex2.code !== "MODULE_NOT_FOUND" ) throw ex2;
                    abort( `Can't load module "${ argument }".` );

                }

            }
            options.plugins.push( mod );
            break;

        case "--trace":
            options.trace = true;
            break;

        case "--no-trace":
            options.trace = false;
            break;

        case "-v":
        case "--version":
            console.log( "PEG.js v" + peg.VERSION );
            process.exit();
            break;

        default:
            if ( inputFile !== null ) {

                abort( `Unknown option: "${ argument }".` );

            }
            inputFile = argument;

    }

}

// Validation and defaults

if ( Object.keys( options.dependencies ).length > 0 ) {

    if ( DEPENDENCY_FORMATS.indexOf( options.format ) === -1 ) {

        abort( `Can't use the -d/--dependency option with the "${ options.format }" module format.` );

    }

}

if ( options.exportVar !== null ) {

    if ( EXPORT_VAR_FORMATS.indexOf( options.format ) === -1 ) {

        abort( `Can't use the -e/--export-var option with the "${ options.format }" module format.` );

    }

}

if ( inputFile === null ) inputFile = "-";

if ( outputFile === null ) {

    if ( inputFile === "-" ) outputFile = "-";
    else if ( inputFile ) {

        outputFile = inputFile
            .substr( 0, inputFile.length - path.extname( inputFile ).length )
            + ".js";

    }

}

// Export

options.inputFile = inputFile;
options.outputFile = outputFile;

module.exports = options;
