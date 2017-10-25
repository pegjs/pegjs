"use strict";

const GrammarError = require( "../../grammar-error" );
const asts = require( "../asts" );
const visitor = require( "../visitor" );

// Reports left recursion in the grammar, which prevents infinite recursion in
// the generated parser.
//
// Both direct and indirect recursion is detected. The pass also correctly
// reports cases like this:
//
//   start = "a"? start
//
// In general, if a rule reference can be reached without consuming any input,
// it can lead to left recursion.
function reportInfiniteRecursion( ast ) {

    const visitedRules = [];

    const check = visitor.build( {
        rule( node ) {

            visitedRules.push( node.name );
            check( node.expression );
            visitedRules.pop( node.name );

        },

        sequence( node ) {

            node.elements.every( element => {

                check( element );

                return ! asts.alwaysConsumesOnSuccess( ast, element );

            } );

        },

        rule_ref( node ) {

            if ( visitedRules.indexOf( node.name ) !== -1 ) {

                visitedRules.push( node.name );
                const rulePath = visitedRules.join( " -> " );

                throw new GrammarError(
                    `Possible infinite loop when parsing (left recursion: ${ rulePath }).`,
                    node.location
                );

            }

            check( asts.findRule( ast, node.name ) );

        }
    } );

    check( ast );

}

module.exports = reportInfiniteRecursion;
