"use strict";

const GrammarError = require( "./grammar-error" );
const ast = require( "./ast" );
const compiler = require( "./compiler" );
const parser = require( "./parser" );
const util = require( "./util" );

const peg = {
    // PEG.js version (uses semantic versioning).
    VERSION: require( "../package.json" ).version,

    GrammarError: GrammarError,
    ast: ast,
    parser: parser,
    compiler: compiler,
    util: util,

    // Generates a parser from a specified grammar and returns it.
    //
    // The grammar must be a string in the format described by the metagramar in
    // the parser.pegjs file.
    //
    // Throws |peg.parser.SyntaxError| if the grammar contains a syntax error or
    // |peg.GrammarError| if it contains a semantic error. Note that not all
    // errors are detected during the generation and some may protrude to the
    // generated parser and cause its malfunction.
    generate( grammar, options = {} ) {

        const session = new compiler.Session( {
            passes: util.convertPasses( compiler.passes ),
        } );

        if ( Array.isArray( options.plugins ) )

            options.plugins.forEach( p => {

                if ( typeof p.use !== "function" ) return;

                p.use( session, options );

            } );

        return compiler.compile(
            session.parse( grammar, options.parser || {} ),
            session,
            options
        );

    },
};

module.exports = peg;
