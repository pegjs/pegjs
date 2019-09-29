"use strict";

const chai = require( "chai" );
const peg = require( "pegjs" );
const sinon = require( "sinon" );

const expect = chai.expect;

describe( "generated parser API", function () {

    describe( "parse", function () {

        it( "parses input", function () {

            const parser = peg.generate( "start = 'a'" );
            expect( parser.parse( "a" ) ).to.equal( "a" );

        } );

        it( "throws an exception on syntax error", function () {

            const parser = peg.generate( "start = 'a'" );
            expect( () => {

                parser.parse( "b" );

            } ).to.throw();

        } );

        describe( "start rule", function () {

            const parser = peg.generate( `

                a = 'x' { return 'a'; }
                b = 'x' { return 'b'; }
                c = 'x' { return 'c'; }

            `, { allowedStartRules: [ "b", "c" ] } );

            describe( "when |startRule| is not set", function () {

                it( "starts parsing from the first allowed rule", function () {

                    expect( parser.parse( "x" ) ).to.equal( "b" );

                } );

            } );

            describe( "when |startRule| is set to an allowed rule", function () {

                it( "starts parsing from specified rule", function () {

                    expect( parser.parse( "x", { startRule: "b" } ) ).to.equal( "b" );
                    expect( parser.parse( "x", { startRule: "c" } ) ).to.equal( "c" );

                } );

            } );

            describe( "when |startRule| is set to a disallowed start rule", function () {

                it( "throws an exception", function () {

                    expect( () => {

                        parser.parse( "x", { startRule: "a" } );

                    } ).to.throw();

                } );

            } );

        } );

        describe( "tracing", function () {

            const parser = peg.generate( `

                start = a / b
                a = 'a'
                b = 'b'

            `, { trace: true } );

            describe( "default tracer", function () {

                it( "traces using console.log (if console is defined)", function () {

                    const messages = [
                        "1:1-1:1 rule.enter start",
                        "1:1-1:1 rule.enter   a",
                        "1:1-1:1 rule.fail    a",
                        "1:1-1:1 rule.enter   b",
                        "1:1-1:2 rule.match   b",
                        "1:1-1:2 rule.match start",
                    ];

                    if ( typeof console === "object" ) sinon.stub( console, "log" );

                    try {

                        parser.parse( "b" );

                        if ( typeof console === "object" ) {

                            expect( console.log.callCount ).to.equal( messages.length );
                            messages.forEach( ( message, index ) => {

                                const call = console.log.getCall( index );
                                expect( call.calledWithExactly( message ) ).to.equal( true );

                            } );

                        }

                    } finally {

                        if ( typeof console === "object" ) console.log.restore();

                    }

                } );

            } );

            describe( "custom tracers", function () {

                describe( "trace", function () {

                    it( "receives tracing events", function () {

                        const events = [
                            {
                                type: "rule.enter",
                                rule: "start",
                                location: {
                                    start: { offset: 0, line: 1, column: 1 },
                                    end: { offset: 0, line: 1, column: 1 },
                                },
                            },
                            {
                                type: "rule.enter",
                                rule: "a",
                                location: {
                                    start: { offset: 0, line: 1, column: 1 },
                                    end: { offset: 0, line: 1, column: 1 },
                                },
                            },
                            {
                                type: "rule.fail",
                                rule: "a",
                                location: {
                                    start: { offset: 0, line: 1, column: 1 },
                                    end: { offset: 0, line: 1, column: 1 },
                                },
                            },
                            {
                                type: "rule.enter",
                                rule: "b",
                                location: {
                                    start: { offset: 0, line: 1, column: 1 },
                                    end: { offset: 0, line: 1, column: 1 },
                                },
                            },
                            {
                                type: "rule.match",
                                rule: "b",
                                result: "b",
                                location: {
                                    start: { offset: 0, line: 1, column: 1 },
                                    end: { offset: 1, line: 1, column: 2 },
                                },
                            },
                            {
                                type: "rule.match",
                                rule: "start",
                                result: "b",
                                location: {
                                    start: { offset: 0, line: 1, column: 1 },
                                    end: { offset: 1, line: 1, column: 2 },
                                },
                            },
                        ];

                        const tracer = { trace: sinon.spy() };
                        parser.parse( "b", { tracer: tracer } );

                        expect( tracer.trace.callCount ).to.equal( events.length );
                        events.forEach( ( event, index ) => {

                            const call = tracer.trace.getCall( index );
                            expect( call.calledWithExactly( event ) ).to.equal( true );

                        } );

                    } );

                } );

            } );

        } );

        it( "accepts custom options", function () {

            const parser = peg.generate( "start = 'a'" );
            parser.parse( "a", { foo: 42 } );

        } );

    } );

} );
