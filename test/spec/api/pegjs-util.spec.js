"use strict";

const chai = require( "chai" );
const util = require( "pegjs-dev" ).util;

const expect = chai.expect;

describe( "PEG.js Utility API", function () {

    describe( "util.convertPasses", function () {

        const passes = {
            stage1: {
                pass1() { },
                pass2() { },
                pass3() { }
            },
            stage2: {
                pass1() { },
                pass2() { }
            },
            stage3: {
                pass1() { }
            }
        };

        function expectPasses( result ) {

            expect( result ).to.be.an( "object" );

            expect( result.stage1 )
                .to.be.an( "array" )
                .and.to.have.a.lengthOf( 3 );

            expect( result.stage2 )
                .to.be.an( "array" )
                .and.to.have.a.lengthOf( 2 );

            expect( result.stage3 )
                .to.be.an( "array" )
                .and.to.have.a.lengthOf( 1 );

        }

        it( "converts a map of stages containing a map of passes", function () {

            expectPasses( util.convertPasses( passes ) );

        } );

        it( "converts a map of stages containing a list of passes", function () {

            expectPasses( util.convertPasses( {
                stage1: [
                    passes.stage1.pass1,
                    passes.stage1.pass2,
                    passes.stage1.pass3
                ],
                stage2: passes.stage2,
                stage3: [
                    passes.stage3.pass1
                ]
            } ) );

        } );

    } );

    describe( "util.clone", function () {

        const meta = { name: "pegjs", version: 0.11, util: util };

        it( "shallow clones an object", function () {

            expect( util.clone( meta ) )
                .to.be.an( "object" )
                .that.has.own.includes( meta );

        } );

        it( "cloned properties refrence same value", function () {

            expect( util.clone( meta ) )
                .to.haveOwnProperty( "util" )
                .that.is.a( "object" )
                .which.equals( util );

        } );

    } );

    describe( "util.each", function () {

        it( "should iterate over an objects properties", function () {

            const size = Object.keys( util ).length;
            const entries = [];

            util.each( util, ( value, key ) => {

                entries.push( { key, value } );

            } );

            expect( entries.length ).to.equal( size );

            entries.forEach( entry => {

                expect( util )
                    .to.have.ownProperty( entry.key )
                    .which.equals( entry.value );

            } );

        } );

    } );

    describe( "util.values", function () {

        const map = { a: 1, b: 2, c: 3 };

        it( "can extract values like Object.values", function () {

            expect( util.values( map ) )
                .to.be.an( "array" )
                .with.a.lengthOf( 3 )
                .and.includes.members( [ 1, 2, 3 ] );

        } );

        it( "can take a transformer, like Array#map", function () {

            expect( util.values( map, n => String( n ) ) )
                .that.includes.members( [ "1", "2", "3" ] );

        } );

    } );

    describe( "util.extend", function () {

        const source = { d: 4, e: 5, f: 6, g: 7, h: 8 };

        it( "extend an empty object", function () {

            const target = {};

            expect( util.extend( target, source ) )
                .to.be.an( "object" )
                .that.includes.keys( Object.keys( source ) );

            expect( util.values( target ) )
                .to.include.members( [ 4, 5, 6, 7, 8 ] )
                .and.have.a.lengthOf( 5 );

        } );

        it( "extend an object", function () {

            const target = util.extend( {}, source );
            const utils = Object.keys( util );

            expect( util.extend( target, util ) )
                .to.include.keys( utils );

            expect( util.values( target ) )
                .to.have.a.lengthOf( 5 + utils.length );

        } );

    } );

    describe( "util.map", function () {

        const object = { a: 1, b: 2, c: 3, d: 4 };
        const result = util.map( object, String );

        it( "returns an object, and not an array, unlike Array#map", function () {

            expect( result )
                .to.be.an( "object" )
                .that.includes.keys( Object.keys( object ) );

        } );

        it( "applies a transformation on each properties value", function () {

            util.each( result, property => {

                expect( property ).to.be.a( "string" );

            } );

        } );

    } );

} );
