"use strict";

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

    }

}
exports.Grammar = Grammar;
