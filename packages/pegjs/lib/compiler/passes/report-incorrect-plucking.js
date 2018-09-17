"use strict";

//
// Check if the given element's expression is of type `semantic_*`
//
function isSemanticPredicate( element ) {

    const type = element.expression.type;

    if ( type === "semantic_and" ) return true;
    if ( type === "semantic_not" ) return true;

    return false;

}

//
// Compiler pass to ensure the following are enforced:
//
//   - plucking can not be done with an action block
//   - cannot pluck a semantic predicate
//
function reportIncorrectPlucking( ast, session ) {

    session.buildVisitor( {

        action( node ) {

            this.visit( node.expression, true );

        },

        labeled( node, action ) {

            if ( node.pick !== true ) return void 0;

            if ( action === true )

                session.error( `"@" cannot be used with an action block.`, node.location );

            if ( isSemanticPredicate( node ) )

                session.error( `"@" cannot be used on a semantic predicate.`, node.location );

            this.visit( node.expression );

        },

    } )( ast );

}

module.exports = reportIncorrectPlucking;
