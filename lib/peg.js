"use strict";

const GrammarError = require( "./grammar-error" );
const compiler = require( "./compiler" );
const parser = require( "./parser" );

const peg = {
    // PEG.js version (uses semantic versioning).
    VERSION: "0.10.0",

    GrammarError: GrammarError,
    parser: parser,
    compiler: compiler,

    // Generates a parser from a specified grammar and returns it.
    //
    // The grammar must be a string in the format described by the metagramar in
    // the parser.pegjs file.
    //
    // Throws |peg.parser.SyntaxError| if the grammar contains a syntax error or
    // |peg.GrammarError| if it contains a semantic error. Note that not all
    // errors are detected during the generation and some may protrude to the
    // generated parser and cause its malfunction.
    generate( grammar, options ) {

        options = typeof options !== "undefined" ? options : {};

        function convertPasses( passes ) {

            const converted = {};

            Object.keys( passes ).forEach( stage => {

                converted[ stage ] = Object.keys( passes[ stage ] )
                    .map( name => passes[ stage ][ name ] );

            } );

            return converted;

        }

        const plugins = "plugins" in options ? options.plugins : [];
        const config = {
            parser: peg.parser,
            passes: convertPasses( peg.compiler.passes )
        };

        plugins.forEach( p => {

            p.use( config, options );

        } );

        return peg.compiler.compile(
            config.parser.parse( grammar ),
            config.passes,
            options
        );

    }
};

module.exports = peg;
