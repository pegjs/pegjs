"use strict";

const util = require( "../util" );
const __slice = Array.prototype.slice;

// Simple AST node visitor builder.
const visitor = {
    build( functions ) {

        function visit( node ) {

            return functions[ node.type ].apply( null, arguments );

        }

        const visitNop = util.noop;

        function visitExpression( node ) {

            const extraArgs = __slice.call( arguments, 1 );

            visit.apply( null, [ node.expression ].concat( extraArgs ) );

        }

        function visitChildren( children, extraArgs ) {

            const args = [ void 0 ].concat( extraArgs );
            const cb = extraArgs.length
                ? function withArgs( child ) {

                    args[ 0 ] = child;
                    visit.apply( null, args );

                }
                : function withoutArgs( child ) {

                    visit( child );

                };

            children.forEach( cb );

        }

        const DEFAULT_FUNCTIONS = {
            grammar( node ) {

                const extraArgs = __slice.call( arguments, 1 );

                if ( node.initializer ) {

                    visit.apply( null, [ node.initializer ].concat( extraArgs ) );

                }

                node.rules.forEach( rule => {

                    visit.apply( null, [ rule ].concat( extraArgs ) );

                } );

            },

            initializer: visitNop,
            rule: visitExpression,
            named: visitExpression,
            choice: util.createVisitor( "alternatives", visitChildren ),
            action: visitExpression,
            sequence: util.createVisitor( "elements", visitChildren ),
            labeled: visitExpression,
            text: visitExpression,
            simple_and: visitExpression,
            simple_not: visitExpression,
            optional: visitExpression,
            zero_or_more: visitExpression,
            one_or_more: visitExpression,
            group: visitExpression,
            semantic_and: visitNop,
            semantic_not: visitNop,
            rule_ref: visitNop,
            literal: visitNop,
            class: visitNop,
            any: visitNop
        };

        util.extend( functions, DEFAULT_FUNCTIONS );

        return visit;

    }
};

module.exports = visitor;
