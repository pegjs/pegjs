"use strict";

const calcReportFailures = require( "./passes/calc-report-failures" );
const generateBytecode = require( "./passes/generate-bytecode" );
const generateJS = require( "./passes/generate-js" );
const removeProxyRules = require( "./passes/remove-proxy-rules" );
const reportDuplicateLabels = require( "./passes/report-duplicate-labels" );
const reportDuplicateRules = require( "./passes/report-duplicate-rules" );
const reportInfiniteRecursion = require( "./passes/report-infinite-recursion" );
const reportInfiniteRepetition = require( "./passes/report-infinite-repetition" );
const reportUndefinedRules = require( "./passes/report-undefined-rules" );
const visitor = require( "./visitor" );

function processOptions( options, defaults ) {

    const processedOptions = {};

    Object.keys( options ).forEach( name => {

        processedOptions[ name ] = options[ name ];

    } );

    Object.keys( defaults ).forEach( name => {

        if ( ! Object.prototype.hasOwnProperty.call( processedOptions, name ) ) {

            processedOptions[ name ] = defaults[ name ];

        }

    } );

    return processedOptions;

}

const compiler = {
    // AST node visitor builder. Useful mainly for plugins which manipulate the
    // AST.
    visitor: visitor,

    // Compiler passes.
    //
    // Each pass is a function that is passed the AST. It can perform checks on it
    // or modify it as needed. If the pass encounters a semantic error, it throws
    // |peg.GrammarError|.
    passes: {
        check: {
            reportUndefinedRules: reportUndefinedRules,
            reportDuplicateRules: reportDuplicateRules,
            reportDuplicateLabels: reportDuplicateLabels,
            reportInfiniteRecursion: reportInfiniteRecursion,
            reportInfiniteRepetition: reportInfiniteRepetition
        },
        transform: {
            removeProxyRules: removeProxyRules
        },
        generate: {
            calcReportFailures: calcReportFailures,
            generateBytecode: generateBytecode,
            generateJS: generateJS
        }
    },

    // Generates a parser from a specified grammar AST. Throws |peg.GrammarError|
    // if the AST contains a semantic error. Note that not all errors are detected
    // during the generation and some may protrude to the generated parser and
    // cause its malfunction.
    compile( ast, passes, options ) {

        options = typeof options !== "undefined" ? options : {};

        options = processOptions( options, {
            allowedStartRules: [ ast.rules[ 0 ].name ],
            cache: false,
            dependencies: {},
            exportVar: null,
            format: "bare",
            optimize: "speed",
            output: "parser",
            trace: false
        } );

        Object.keys( passes ).forEach( stage => {

            passes[ stage ].forEach( pass => {

                pass( ast, options );

            } );

        } );

        switch ( options.output ) {

            case "parser":
                return eval( ast.code );

            case "source":
                return ast.code;

            default:
                throw new Error( `Invalid output format: ${ options.output }.` );

        }

    }
};

module.exports = compiler;
