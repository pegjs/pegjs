"use strict";

const GrammarError = require( "../../grammar-error" );
const visitor = require( "../visitor" );

// Checks that each label is defined only once within each scope.
function reportDuplicateLabels( ast ) {

    let check;

    function cloneEnv( env ) {

        const clone = {};

        Object.keys( env ).forEach( name => {

            clone[ name ] = env[ name ];

        } );

        return clone;

    }

    function checkExpressionWithClonedEnv( node, env ) {

        check( node.expression, cloneEnv( env ) );

    }

    check = visitor.build( {
        rule( node ) {

            check( node.expression, {} );

        },

        choice( node, env ) {

            node.alternatives.forEach( alternative => {

                check( alternative, cloneEnv( env ) );

            } );

        },

        action: checkExpressionWithClonedEnv,

        labeled( node, env ) {

            const label = node.label;

            if ( Object.prototype.hasOwnProperty.call( env, label ) ) {

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
