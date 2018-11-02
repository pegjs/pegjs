"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "pegjs" ).compiler.passes.check.reportUndefinedRules;

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |reportUndefinedRules|", function () {

    it( "reports undefined rules", function () {

        expect( pass ).to.reportError( "start = undefined", {
            message: "Rule \"undefined\" is not defined.",
            location: {
                start: { offset: 8, line: 1, column: 9 },
                end: { offset: 17, line: 1, column: 18 }
            }
        } );

    } );

    it( "checks allowedStartRules", function () {

        expect( pass ).to.reportError( "start = 'a'", {
            message: "Start rule \"missing\" is not defined."
        }, {
            allowedStartRules: [ "missing" ]
        } );

    } );

} );
