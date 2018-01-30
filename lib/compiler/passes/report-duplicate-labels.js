"use strict";

const GrammarError = require( "../../grammar-error" );
const util = require( "../../util" );
const __hasOwnProperty = Object.prototype.hasOwnProperty;

// Checks that each label is defined only once within each scope.
function reportDuplicateLabels( ast, session ) {

    let check;

    function checkExpressionWithClonedEnv( node, env ) {

        check( node.expression, util.clone( env ) );

    }

    check = session.buildVisitor( {
        rule( node ) {

            check( node.expression, {} );

        },

        choice( node, env ) {

            node.alternatives.forEach( alternative => {

                check( alternative, util.clone( env ) );

            } );

        },

        action: checkExpressionWithClonedEnv,

        labeled( node, env ) {

            const label = node.label;

            if ( __hasOwnProperty.call( env, label ) ) {

                const start = env[ label ].start;

                throw new GrammarError(
                    `Label "${ label }" is already defined at line ${ start.line }, column ${ start.column }.`,
                    node.location
                );

            }

            check( node.expression, env );
            env[ label ] = node.location;

        },

        text: checkExpressionWithClonedEnv,
        simple_and: checkExpressionWithClonedEnv,
        simple_not: checkExpressionWithClonedEnv,
        optional: checkExpressionWithClonedEnv,
        zero_or_more: checkExpressionWithClonedEnv,
        one_or_more: checkExpressionWithClonedEnv,
        group: checkExpressionWithClonedEnv
    } );

    check( ast );

}

module.exports = reportDuplicateLabels;
