"use strict";

const GrammarError = require( "../../grammar-error" );
const visitor = require( "../../ast" ).visitor;

// Checks that all referenced rules exist.
function reportUndefinedRules( ast, options ) {

    const check = visitor.build( {
        rule_ref( node ) {

            if ( ! ast.findRule( node.name ) ) {

                throw new GrammarError(
                    `Rule "${ node.name }" is not defined.`,
                    node.location
                );

            }

        }
    } );

    check( ast );

    options.allowedStartRules.forEach( rule => {

        if ( ! ast.findRule( rule ) ) {

            throw new GrammarError( `Start rule "${ rule }" is not defined.` );

        }

    } );

}

module.exports = reportUndefinedRules;
