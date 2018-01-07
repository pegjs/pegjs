"use strict";

const LikeHelper = require( "chai-like" );
const parser = require( "pegjs-dev" ).parser;

module.exports = function ( chai, utils ) {

    chai.use( LikeHelper );

    const Assertion = chai.Assertion;

    Assertion.addMethod( "changeAST", function ( grammar, props, options, additionalRuleProps ) {

        options = typeof options !== "undefined" ? options : {};
        additionalRuleProps = typeof additionalRuleProps !== "undefined" ? additionalRuleProps : { reportFailures: true };

        const ast = parser.parse( grammar );

        if ( ! options.allowedStartRules ) {

            options.allowedStartRules = ast.rules.length > 0
                ? [ ast.rules[ 0 ].name ]
                : [];

        }

        ast.rules = ast.rules.map( rule => Object.assign( rule, additionalRuleProps ) );

        utils.flag( this, "object" )( ast, options );

        new Assertion( ast ).like( props );

    } );

    Assertion.addMethod( "reportError", function ( grammar, props, options ) {

        options = typeof options !== "undefined" ? options : {};

        const ast = parser.parse( grammar );

        if ( ! options.allowedStartRules ) {

            options.allowedStartRules = ast.rules.length > 0
                ? [ ast.rules[ 0 ].name ]
                : [];

        }

        let passed, result;

        try {

            utils.flag( this, "object" )( ast, options );
            passed = true;

        } catch ( e ) {

            result = e;
            passed = false;

        }

        this.assert(
            ! passed,
            "expected #{this} to report an error but it didn't",
            "expected #{this} to not report an error but #{act} was reported",
            null,
            result
        );

        if ( ! passed && typeof props !== "undefined" ) {

            Object.keys( props ).forEach( key => {

                new Assertion( result )
                    .to.have.property( key )
                    .that.is.deep.equal( props[ key ] );

            } );

        }

    } );

};
