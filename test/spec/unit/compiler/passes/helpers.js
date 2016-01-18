"use strict";

const parser = require( "pegjs-dev" ).parser;

module.exports = function ( chai, utils ) {

    const Assertion = chai.Assertion;

    Assertion.addMethod( "changeAST", function ( grammar, props, options, additionalRuleProps ) {

        options = typeof options !== "undefined" ? options : {};
        additionalRuleProps = typeof additionalRuleProps !== "undefined" ? additionalRuleProps : { reportFailures: true };

        function matchProps( value, props ) {

            function isObject( value ) {

                return value !== null && typeof value === "object";

            }

            if ( Array.isArray( props ) ) {

                if ( ! Array.isArray( value ) ) return false;
                if ( value.length !== props.length ) return false;

                for ( let i = 0; i < props.length; i++ ) {

                    if ( ! matchProps( value[ i ], props[ i ] ) ) return false;

                }

                return true;

            } else if ( isObject( props ) ) {

                if ( ! isObject( value ) ) return false;

                const keys = Object.keys( props );
                for ( let i = 0; i < keys.length; i++ ) {

                    const key = keys[ i ];

                    if ( ! ( key in value ) ) return false;
                    if ( ! matchProps( value[ key ], props[ key ] ) ) return false;

                }

                return true;

            }

            return value === props;

        }

        const ast = parser.parse( grammar );

        if ( ! options.allowedStartRules ) {

            options.allowedStartRules = ast.rules.length > 0
                ? [ ast.rules[ 0 ].name ]
                : [];

        }

        ast.rules = ast.rules.map( rule => Object.assign( rule, additionalRuleProps ) );

        utils.flag( this, "object" )( ast, options );

        this.assert(
            matchProps( ast, props ),
            "expected #{this} to change the AST to match #{exp} but #{act} was produced",
            "expected #{this} to not change the AST to match #{exp}",
            props,
            ast
        );

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
