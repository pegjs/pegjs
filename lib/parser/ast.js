"use strict";

const visitor = require( "../compiler/visitor" );
const util = require( "../util" );

class Node {

    constructor( type, location ) {

        this.type = type;
        this.location = location;

    }

}
exports.Node = Node;

class Grammar extends Node {

    // Creates a new AST
    constructor( initializer, rules, comments, location ) {

        super( "grammar", location );

        this.initializer = initializer;
        this.comments = comments;
        this.rules = rules;

        this._alwaysConsumesOnSuccess = new AlwaysConsumesOnSuccess( this );

    }

    alwaysConsumesOnSuccess( node ) {

        return this._alwaysConsumesOnSuccess.visit( node );

    }

    findRule( name ) {

        return this.rules.find( rule => rule.name === name );

    }

    indexOfRule( name ) {

        const rules = this.rules;

        for ( let i = 0; i < rules.length; ++i ) {

            if ( rules[ i ].name === name ) return i;

        }

        return -1;

    }

}
exports.Grammar = Grammar;

/* ***************************** @private ***************************** */

class AlwaysConsumesOnSuccess extends visitor.ASTVisitor {

    constructor( ast ) {

        super();
        this.ast = ast;

    }

    choice( node ) {

        return node.alternatives.every( this.visit, this );

    }

    sequence( node ) {

        return node.elements.some( this.visit, this );

    }

    rule_ref( node ) {

        return this.visit( this.ast.findRule( node.name ) );

    }

    literal( node ) {

        return node.value !== "";

    }

}

function consumesTrue() {

    return true;

}

function consumesFalse() {

    return false;

}

function consumesExpression( node ) {

    return this.visit( node.expression );

}

util.extend( AlwaysConsumesOnSuccess.prototype, {

    rule: consumesExpression,
    named: consumesExpression,
    action: consumesExpression,
    labeled: consumesExpression,
    text: consumesExpression,
    simple_and: consumesFalse,
    simple_not: consumesFalse,
    optional: consumesFalse,
    zero_or_more: consumesFalse,
    one_or_more: consumesExpression,
    group: consumesExpression,
    semantic_and: consumesFalse,
    semantic_not: consumesFalse,
    class: consumesTrue,
    any: consumesTrue,

} );
