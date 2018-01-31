"use strict";

const ast = require( "../ast" );
const opcodes = require( "./opcodes" );
const parser = require( "../parser" );

class Session {

    constructor( options ) {

        options = typeof options !== "undefined" ? options : {};

        this.grammar = options.grammar;
        this.opcodes = options.opcodes || opcodes;
        this.parser = options.parser || parser;
        this.passes = options.passes || [];
        this.visitor = options.visitor || ast.visitor;

        if ( typeof options.warn === "function" ) this.warn = options.warn;

    }

    parse( input, options ) {

        return this.parser.parse( input, options );

    }

    buildVisitor( functions ) {

        return this.visitor.build( functions );

    }

    warn( message, details ) {}

}

module.exports = Session;
