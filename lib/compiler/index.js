"use strict";

const calcReportFailures = require( "./passes/calc-report-failures" );
const generateBytecode = require( "./passes/generate-bytecode" );
const generateJS = require( "./passes/generate-js" );
const removeProxyRules = require( "./passes/remove-proxy-rules" );
const reportDuplicateLabels = require( "./passes/report-duplicate-labels" );
const reportDuplicateRules = require( "./passes/report-duplicate-rules" );
const reportUnusedRules = require( "./passes/report-unused-rules" );
const reportInfiniteRecursion = require( "./passes/report-infinite-recursion" );
const reportInfiniteRepetition = require( "./passes/report-infinite-repetition" );
const reportUndefinedRules = require( "./passes/report-undefined-rules" );
const inferenceMatchResult = require( "./passes/inference-match-result" );
const Session = require( "./session" );
const util = require( "../util" );
const vm = require( "./vm" );

function processOptions( options, defaults ) {

    const processedOptions = {};

    util.extend( processedOptions, options );
    util.extend( processedOptions, defaults );

    return processedOptions;

}

const compiler = {

    Session: Session,
    vm: vm,

    // Compiler passes.
    //
    // Each pass is a function that is passed the AST. It can perform checks on it
    // or modify it as needed. If the pass encounters a semantic error, it throws
    // |peg.GrammarError|.
    passes: {
        check: {
            reportUndefinedRules: reportUndefinedRules,
            reportDuplicateRules: reportDuplicateRules,
            reportUnusedRules: reportUnusedRules,
            reportDuplicateLabels: reportDuplicateLabels,
            reportInfiniteRecursion: reportInfiniteRecursion,
            reportInfiniteRepetition: reportInfiniteRepetition
        },
        transform: {
            removeProxyRules: removeProxyRules
        },
        generate: {
            calcReportFailures: calcReportFailures,
            inferenceMatchResult: inferenceMatchResult,
            generateBytecode: generateBytecode,
            generateJS: generateJS
        }
    },

    // Generates a parser from a specified grammar AST. Throws |peg.GrammarError|
    // if the AST contains a semantic error. Note that not all errors are detected
    // during the generation and some may protrude to the generated parser and
    // cause its malfunction.
    compile( ast, session, options ) {

        options = typeof options !== "undefined" ? options : {};

        options = processOptions( options, {
            allowedStartRules: [ ast.rules[ 0 ].name ],
            cache: false,
            context: {},
            dependencies: {},
            exportVar: null,
            format: "bare",
            header: null,
            optimize: "speed",
            output: "parser",
            trace: false
        } );

        util.each( session.passes, stage => {

            stage.forEach( pass => {

                pass( ast, session, options );

            } );

        } );

        switch ( options.output ) {

            case "parser":
                return session.vm.runInContext( ast.code, options.context );

            case "source":
                return ast.code;

            default:
                session.error( `Invalid output format: ${ options.output }.` );

        }

    }

};

module.exports = compiler;
