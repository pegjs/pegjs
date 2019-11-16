"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "pegjs" ).compiler.passes.check.reportUnusedRules;

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |reportUnusedRules|", function () {

    it( "should report rules that are not referenced", function () {

        expect( pass ).to.reportWarning(
            `
                start = .
                unused = .
            `,
            `Rule "unused" is not referenced.`,
        );

        expect( pass ).to.reportWarning(
            `
                start = .
                unused = .
                used = .
            `,
            [
                `Rule "used" is not referenced.`,
                `Rule "unused" is not referenced.`,
            ],
        );

    } );

    it( "does not report rules that are referenced", function () {

        expect( pass ).not.to.reportWarning( `start = .` );

        expect( pass ).not.to.reportWarning( `
            start = used
            used = .
        ` );

    } );

    it( "does not report any rules that the generated parser starts parsing from", function () {

        expect( pass ).not.to.reportWarning(
            `
                a = "x"
                b = a
                c = .+
            `,
            null,
            {
                allowedStartRules: [ "b", "c" ],
            },
        );

    } );

} );
