/* eslint no-unused-vars: 0 */

"use strict";

const ast = require( "../ast" );
const GrammarError = require( "../grammar-error" );
const opcodes = require( "./opcodes" );
const parser = require( "../parser" );

function fatal( message, location ) {

    if ( typeof location !== "undefined" )

        throw new GrammarError( message, location );

    throw new Error( message );

}

class Session {

    constructor( options ) {

        options = typeof options !== "undefined" ? options : {};

        this.grammar = options.grammar;
        this.opcodes = options.opcodes || opcodes;
        this.parser = options.parser || parser;
        this.passes = options.passes || [];
        this.visitor = options.visitor || ast.visitor;

        if ( typeof options.warn === "function" ) this.warn = options.warn;
        if ( typeof options.error === "function" ) this.error = options.error;

        Object.defineProperty( this, "fatal", { value: fatal } );

    }

    parse( input, options ) {

        return this.parser.parse( input, options );

    }

    buildVisitor( functions ) {

        return this.visitor.build( functions );

    }

    warn( message, location ) {}

    error( message, location ) {

        fatal( message, location );

    }

}

module.exports = Session;
