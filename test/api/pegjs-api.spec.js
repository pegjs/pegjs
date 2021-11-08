"use strict";

const chai = require( "chai" );
const peg = require( "pegjs" );
const sinon = require( "sinon" );

const expect = chai.expect;

describe( "PEG.js API", function () {

    describe( "generate", function () {

        it( "generates a parser", function () {

            const parser = peg.generate( "start = 'a'" );

            expect( parser ).to.be.an( "object" );
            expect( parser.parse( "a" ) ).to.equal( "a" );

        } );

        it( "throws an exception on syntax error", function () {

            expect( () => {

                peg.generate( "start = @" );

            } ).to.throw();

        } );

        it( "throws an exception on semantic error", function () {

            expect( () => {

                peg.generate( "start = undefined" );

            } ).to.throw();

        } );

        describe( "allowed start rules", function () {

            const grammar = `

                a = 'x'
                b = 'x'
                c = 'x'

            `;

            it( "throws an error on missing rule", function () {

                expect( () => {

                    peg.generate( grammar, { allowedStartRules: [ "missing" ] } );

                } ).to.throw();

            } );

            // The |allowedStartRules| option is implemented separately for each
            // optimization mode, so we need to test it in both.

            describe( "when optimizing for parsing speed", function () {

                describe( "when |allowedStartRules| is not set", function () {

                    it( "generated parser can start only from the first rule", function () {

                        const parser = peg.generate( grammar, { optimize: "speed" } );

                        expect( parser.parse( "x", { startRule: "a" } ) ).to.equal( "x" );
                        expect( () => {

                            parser.parse( "x", { startRule: "b" } );

                        } ).to.throw();
                        expect( () => {

                            parser.parse( "x", { startRule: "c" } );

                        } ).to.throw();

                    } );

                } );

                describe( "when |allowedStartRules| is set", function () {

                    it( "generated parser can start only from specified rules", function () {

                        const parser = peg.generate( grammar, {
                            optimize: "speed",
                            allowedStartRules: [ "b", "c" ],
                        } );

                        expect( () => {

                            parser.parse( "x", { startRule: "a" } );

                        } ).to.throw();
                        expect( parser.parse( "x", { startRule: "b" } ) ).to.equal( "x" );
                        expect( parser.parse( "x", { startRule: "c" } ) ).to.equal( "x" );

                    } );

                } );

            } );

            describe( "when optimizing for code size", function () {

                describe( "when |allowedStartRules| is not set", function () {

                    it( "generated parser can start only from the first rule", function () {

                        const parser = peg.generate( grammar, { optimize: "size" } );

                        expect( parser.parse( "x", { startRule: "a" } ) ).to.equal( "x" );
                        expect( () => {

                            parser.parse( "x", { startRule: "b" } );

                        } ).to.throw();
                        expect( () => {

                            parser.parse( "x", { startRule: "c" } );

                        } ).to.throw();

                    } );

                } );

                describe( "when |allowedStartRules| is set", function () {

                    it( "generated parser can start only from specified rules", function () {

                        const parser = peg.generate( grammar, {
                            optimize: "size",
                            allowedStartRules: [ "b", "c" ],
                        } );

                        expect( () => {

                            parser.parse( "x", { startRule: "a" } );

                        } ).to.throw();
                        expect( parser.parse( "x", { startRule: "b" } ) ).to.equal( "x" );
                        expect( parser.parse( "x", { startRule: "c" } ) ).to.equal( "x" );

                    } );

                } );

            } );

        } );

        describe( "intermediate results caching", function () {

            const grammar = `

                { var n = 0; }
                start = (a 'b') / (a 'c') { return n; }
                a = 'a' { n++; }

            `;

            describe( "when |cache| is not set", function () {

                it( "generated parser doesn't cache intermediate parse results", function () {

                    const parser = peg.generate( grammar );
                    expect( parser.parse( "ac" ) ).to.equal( 2 );

                } );

            } );

            describe( "when |cache| is set to |false|", function () {

                it( "generated parser doesn't cache intermediate parse results", function () {

                    const parser = peg.generate( grammar, { cache: false } );
                    expect( parser.parse( "ac" ) ).to.equal( 2 );

                } );

            } );

            describe( "when |cache| is set to |true|", function () {

                it( "generated parser caches intermediate parse results", function () {

                    const parser = peg.generate( grammar, { cache: true } );
                    expect( parser.parse( "ac" ) ).to.equal( 1 );

                } );

            } );

        } );

        describe( "tracing", function () {

            const grammar = "start = 'a'";

            describe( "when |trace| is not set", function () {

                it( "generated parser doesn't trace", function () {

                    const parser = peg.generate( grammar );
                    const tracer = { trace: sinon.spy() };

                    parser.parse( "a", { tracer: tracer } );

                    expect( tracer.trace.called ).to.equal( false );

                } );

            } );

            describe( "when |trace| is set to |false|", function () {

                it( "generated parser doesn't trace", function () {

                    const parser = peg.generate( grammar, { trace: false } );
                    const tracer = { trace: sinon.spy() };

                    parser.parse( "a", { tracer: tracer } );

                    expect( tracer.trace.called ).to.equal( false );

                } );

            } );

            describe( "when |trace| is set to |true|", function () {

                it( "generated parser traces", function () {

                    const parser = peg.generate( grammar, { trace: true } );
                    const tracer = { trace: sinon.spy() };

                    parser.parse( "a", { tracer: tracer } );

                    expect( tracer.trace.called ).to.equal( true );

                } );

            } );

        } );

        // The |optimize| option isn't tested because there is no meaningful way to
        // write the tests without turning this into a performance test.

        describe( "output", function () {

            const grammar = "start = 'a'";

            describe( "when |output| is not set", function () {

                it( "returns generated parser object", function () {

                    const parser = peg.generate( grammar );

                    expect( parser ).to.be.an( "object" );
                    expect( parser.parse( "a" ) ).to.equal( "a" );

                } );

            } );

            describe( "when |output| is set to |\"parser\"|", function () {

                it( "returns generated parser object", function () {

                    const parser = peg.generate( grammar, { output: "parser" } );

                    expect( parser ).to.be.an( "object" );
                    expect( parser.parse( "a" ) ).to.equal( "a" );

                } );

            } );

            describe( "when |output| is set to |\"source\"|", function () {

                it( "returns generated parser source code", function () {

                    const source = peg.generate( grammar, { output: "source" } );

                    expect( source ).to.be.a( "string" );
                    expect( eval( source ).parse( "a" ) ).to.equal( "a" );

                } );

            } );

        } );

        // The |format|, |exportVars|, and |dependencies| options are not tested
        // because there is no meaningful way to test their effects without turning
        // this into an integration test.

        // The |plugins| option is tested in plugin API tests.

        describe( "reserved words", function () {

            const RESERVED_WORDS = peg.util.reservedWords;

            describe( "throws an exception on reserved JS words used as labels", function () {

                for ( const label of RESERVED_WORDS ) {

                    it( label, function () {

                        expect( () => {

                            peg.generate( [
                                "start = " + label + ":end",
                                "end = 'a'",
                            ].join( "\n" ), { output: "source" } );

                        } ).to.throw( peg.parser.SyntaxError );

                    } );

                }

            } );

            describe( "not throws an exception on reserved JS words used as rule name", function () {

                for ( const rule of RESERVED_WORDS ) {

                    it( rule, function () {

                        expect( () => {

                            peg.generate( [
                                "start = " + rule,
                                rule + " = 'a'",
                            ].join( "\n" ), { output: "source" } );

                        } ).to.not.throw( peg.parser.SyntaxError );

                    } );

                }

            } );

        } );

        it( "accepts custom options", function () {

            peg.generate( "start = 'a'", { foo: 42 } );

        } );

    } );

} );
