"use strict";

const GrammarError = require( "../../grammar-error" );
const visitor = require( "../../ast" ).visitor;

// Reports expressions that don't consume any input inside |*| or |+| in the
// grammar, which prevents infinite loops in the generated parser.
function reportInfiniteRepetition( ast ) {

    const check = visitor.build( {
        zero_or_more( node ) {

            if ( ! ast.alwaysConsumesOnSuccess( node.expression ) ) {

                throw new GrammarError(
                    "Possible infinite loop when parsing (repetition used with an expression that may not consume any input).",
                    node.location
                );

            }

        },

        one_or_more( node ) {

            if ( ! ast.alwaysConsumesOnSuccess( node.expression ) ) {

                throw new GrammarError(
                    "Possible infinite loop when parsing (repetition used with an expression that may not consume any input).",
                    node.location
                );

            }

        }
    } );

    check( ast );

}

module.exports = reportInfiniteRepetition;
