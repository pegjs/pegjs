"use strict";

const LikeHelper = require( "chai-like" );
const Session = require( "pegjs" ).compiler.Session;

module.exports = function ( chai, utils ) {

    chai.use( LikeHelper );

    const Assertion = chai.Assertion;

    function parse( grammar, session, options ) {

        const ast = session.parse( grammar );

        if ( ! options.allowedStartRules ) {

            options.allowedStartRules = ast.rules.length > 0
                ? [ ast.rules[ 0 ].name ]
                : [];

        }

        return ast;

    }

    Assertion.addMethod( "changeAST", function ( grammar, props, options, additionalRuleProps ) {

        options = typeof options !== "undefined" ? options : {};
        additionalRuleProps = typeof additionalRuleProps !== "undefined" ? additionalRuleProps : { reportFailures: true };

        const session = new Session( { grammar } );
        const ast = parse( grammar, session, options );

        ast.rules = ast.rules.map( rule => Object.assign( rule, additionalRuleProps ) );

        utils.flag( this, "object" )( ast, session, options );

        new Assertion( ast ).like( props );

    } );

    Assertion.addMethod( "reportError", function ( grammar, props, options ) {

        options = typeof options !== "undefined" ? options : {};

        const session = new Session( { grammar } );
        const ast = parse( grammar, session, options );

        let passed, result;

        try {

            utils.flag( this, "object" )( ast, session, options );
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

            if ( typeof props === "string" ) props = { message: props };

            Object.keys( props ).forEach( key => {

                new Assertion( result )
                    .to.have.property( key )
                    .that.is.deep.equal( props[ key ] );

            } );

        }

    } );

    Assertion.addMethod( "reportWarning", function ( grammar, warnings, options ) {

        warnings = Array.isArray( warnings )
            ? warnings
            : warnings == null
                ? []
                : [ warnings ];

        options = typeof options !== "undefined" ? options : {};

        const messages = [];
        function warn( message ) {

            messages.push( message );

        }

        const session = new Session( { grammar, warn } );
        const ast = parse( grammar, session, options );

        utils.flag( this, "object" )( ast, session, options );

        const messagesCount = messages.length;
        const warningsCount = warnings.length;

        if ( warnings.length )

            this.assert(
                messagesCount === warningsCount,
                `expected #{this} to report ${ warningsCount } warnings, but it reported ${ messagesCount } warnings`,
                `expected #{this} to not report ${ warningsCount } warnings`,
                warnings,
                messages
            );

        warnings.forEach( warning => {

            this.assert(
                messages.indexOf( warning ) !== -1,
                "expected #{this} to report the warning #{exp}, but it didn't",
                "expected #{this} to not report the warning #{exp}",
                warning
            );

        } );

    } );

};
