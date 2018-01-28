"use strict";

const util = require( "../util" );
const __slice = Array.prototype.slice;

// Abstract syntax tree visitor for PEG.js
class ASTVisitor {

    // Will traverse the node, strictly assuming the visitor can handle the node type.
    visit( node ) {

        // istanbul ignore next
        if ( ! node ) throw new Error( "Visitor function called with no arguments or a `falsy` node" );

        const fn = this[ node.type ];

        // istanbul ignore next
        if ( ! fn ) throw new Error( `Visitor function for node type "${ node.type }" not defined` );

        return fn.apply( this, arguments );

    }

}

module.exports = {

    ASTVisitor,

    // Simple AST node visitor builder for PEG.js
    build( functions ) {

        let visitor = new ASTVisitor();
        util.extend( visitor, functions );
        visitor = util.enforceFastProperties( visitor );
        return visitor.visit.bind( visitor );

    },

};

// Helper's to create visitor's for use with the ASTVisitor class
const on = ASTVisitor.for = {

    // Visit a node that is defined as a property on another node
    property( name ) {

        return function visitProperty( node ) {

            const extraArgs = __slice.call( arguments, 1 );
            const value = node[ name ];

            if ( extraArgs.length )

                this.visit.apply( this, [ value ].concat( extraArgs ) );

            else

                this.visit( value );

        };

    },

    // Visit an array of nodes that are defined as a property on another node
    children( name ) {

        return function visitProperty( node ) {

            const args = __slice.call( arguments, 0 );
            const children = node[ name ];
            const visitor = this;

            const cb = args.length < 2
                ? function withoutArgs( child ) {

                    visitor.visit( child );

                }
                : function withArgs( child ) {

                    args[ 0 ] = child;
                    visitor.visit.apply( visitor, args );

                };

            children.forEach( cb );

        };

    },

};

// Build the default ast visitor functions

const visitNop = util.noop;
const visitExpression = on.property( "expression" );

const DEFAULT_FUNCTIONS = {

    grammar( node ) {

        const args = [ void 0 ].concat( __slice.call( arguments, 1 ) );

        if ( node.initializer ) {

            args[ 0 ] = node.initializer;
            this.visit.apply( this, args );

        }

        node.rules.forEach( rule => {

            args[ 0 ] = rule;
            this.visit.apply( this, args );

        } );

    },

    initializer: visitNop,
    rule: visitExpression,
    named: visitExpression,
    choice: on.children( "alternatives" ),
    action: visitExpression,
    sequence: on.children( "elements" ),
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
    any: visitNop,

};

util.each( DEFAULT_FUNCTIONS, ( fn, name ) => {

    ASTVisitor.prototype[ name ] = fn;

} );
