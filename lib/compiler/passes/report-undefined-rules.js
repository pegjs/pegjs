"use strict";

const GrammarError = require( "../../grammar-error" );
const asts = require( "../asts" );
const visitor = require( "../visitor" );

// Checks that all referenced rules exist.
function reportUndefinedRules( ast, options ) {

    const check = visitor.build( {
        rule_ref( node ) {

            if ( ! asts.findRule( ast, node.name ) ) {

                throw new GrammarError(
                    `Rule "${ node.name }" is not defined.`,
                    node.location
                );

            }

        }
    } );

    check( ast );

    if ( options.allowedStartRules ) {

        options.allowedStartRules.forEach( rule => {

            if ( ! asts.findRule( ast, rule ) ) {

                throw new GrammarError( `Start rule "${ rule }" is not defined.` );

            }

        } );

    }

}

module.exports = reportUndefinedRules;
