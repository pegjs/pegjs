"use strict";

const chai = require( "chai" );
const peg = require( "pegjs" );

const expect = chai.expect;

describe( "plugin API", function () {

    describe( "use", function () {

        const grammar = "start = 'a'";

        it( "is called for each plugin", function () {

            const pluginsUsed = [ false, false, false ];
            const plugins = [
                { use() {

                    pluginsUsed[ 0 ] = true;

                } },
                { use() {

                    pluginsUsed[ 1 ] = true;

                } },
                { use() {

                    pluginsUsed[ 2 ] = true;

                } }
            ];

            peg.generate( grammar, { plugins: plugins } );

            expect( pluginsUsed ).to.deep.equal( [ true, true, true ] );

        } );

        it( "receives configuration", function () {

            const plugin = {
                use( config ) {

                    expect( config ).to.be.an( "object" );

                    expect( config.parser ).to.be.an( "object" );
                    expect( config.parser.parse( "start = 'a'" ) ).to.be.an( "object" );

                    expect( config.passes ).to.be.an( "object" );

                    expect( config.passes.check ).to.be.an( "array" );
                    config.passes.check.forEach( pass => {

                        expect( pass ).to.be.a( "function" );

                    } );

                    expect( config.passes.transform ).to.be.an( "array" );
                    config.passes.transform.forEach( pass => {

                        expect( pass ).to.be.a( "function" );

                    } );

                    expect( config.passes.generate ).to.be.an( "array" );
                    config.passes.generate.forEach( pass => {

                        expect( pass ).to.be.a( "function" );

                    } );

                }
            };

            peg.generate( grammar, { plugins: [ plugin ] } );

        } );

        it( "receives options", function () {

            const generateOptions = {
                plugins: [ {
                    use( config, options ) {

                        expect( options ).to.equal( generateOptions );

                    }
                } ],
                foo: 42
            };

            peg.generate( grammar, generateOptions );

        } );

        it( "can replace parser", function () {

            const plugin = {
                use( config ) {

                    config.parser = peg.generate( `

                        start = .* {
                            return new ast.Grammar( void 0, [{
                                type: "rule",
                                name: "start",
                                expression: {
                                    type: "literal",
                                    value: text(),
                                    ignoreCase: false
                                }
                            }] );
                        }

                    `, { context: { ast: peg.ast } } );

                }
            };

            const parser = peg.generate( "a", { plugins: [ plugin ] } );
            expect( parser.parse( "a" ) ).to.equal( "a" );

        } );

        it( "can change compiler passes", function () {

            const plugin = {
                use( config ) {

                    function pass( ast ) {

                        ast.code = "exports.parse = function() { return 42; }";

                    }

                    config.passes.generate = [ pass ];

                }
            };

            const parser = peg.generate( grammar, { plugins: [ plugin ] } );
            expect( parser.parse( "a" ) ).to.equal( 42 );

        } );

        it( "can change options", function () {

            const grammar = `

                a = 'x'
                b = 'x'
                c = 'x'

            `;
            const plugin = {
                use( config, options ) {

                    options.allowedStartRules = [ "b", "c" ];

                }
            };

            const parser = peg.generate( grammar, {
                allowedStartRules: [ "a" ],
                plugins: [ plugin ]
            } );

            expect( () => {

                parser.parse( "x", { startRule: "a" } );

            } ).to.throw();
            expect( parser.parse( "x", { startRule: "b" } ) ).to.equal( "x" );
            expect( parser.parse( "x", { startRule: "c" } ) ).to.equal( "x" );

        } );

    } );

} );
