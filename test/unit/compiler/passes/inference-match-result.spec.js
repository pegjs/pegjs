"use strict";

const chai = require( "chai" );
const helpers = require( "./helpers" );
const pass = require( "pegjs" ).compiler.passes.generate.inferenceMatchResult;

chai.use( helpers );

const expect = chai.expect;

describe( "compiler pass |inferenceMatchResult|", function () {

    it( "calculate |match| property for |any| correctly", function () {

        expect( pass ).to.changeAST( "start = .          ", { rules: [ { match:  0 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |literal| correctly", function () {

        expect( pass ).to.changeAST( "start = ''         ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ''i        ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = 'a'        ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = 'a'i       ", { rules: [ { match:  0 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |class| correctly", function () {

        expect( pass ).to.changeAST( "start = []         ", { rules: [ { match: -1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = []i        ", { rules: [ { match: -1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [a]        ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [a]i       ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [a-b]      ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [a-b]i     ", { rules: [ { match:  0 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |sequence| correctly", function () {

        expect( pass ).to.changeAST( "start = 'a' 'b'    ", { rules: [ { match:  0 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = 'a' ''     ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = '' 'b'     ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = '' ''      ", { rules: [ { match:  1 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = 'a' []     ", { rules: [ { match: -1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [] 'b'     ", { rules: [ { match: -1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [] []      ", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |choice| correctly", function () {

        expect( pass ).to.changeAST( "start = 'a' / 'b'  ", { rules: [ { match:  0 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = 'a' / ''   ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ''  / 'b'  ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ''  / ''   ", { rules: [ { match:  1 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = 'a' / []   ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = []  / 'b'  ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = []  / []   ", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for predicates correctly", function () {

        expect( pass ).to.changeAST( "start = &.         ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = &''        ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = &[]        ", { rules: [ { match: -1 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = !.         ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = !''        ", { rules: [ { match: -1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ![]        ", { rules: [ { match:  1 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = &{ code }  ", { rules: [ { match: 0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = !{ code }  ", { rules: [ { match: 0 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |text| correctly", function () {

        expect( pass ).to.changeAST( "start = $.         ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = $''        ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = $[]        ", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |action| correctly", function () {

        expect( pass ).to.changeAST( "start = .  { code }", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = '' { code }", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [] { code }", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |labeled| correctly", function () {

        expect( pass ).to.changeAST( "start = a:.        ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = a:''       ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = a:[]       ", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |named| correctly", function () {

        expect( pass ).to.changeAST( "start 'start' = .  ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start 'start' = '' ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start 'start' = [] ", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |optional| correctly", function () {

        expect( pass ).to.changeAST( "start = .?         ", { rules: [ { match: 1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ''?        ", { rules: [ { match: 1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = []?        ", { rules: [ { match: 1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |zero_or_more| correctly", function () {

        expect( pass ).to.changeAST( "start = .*         ", { rules: [ { match: 1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ''*        ", { rules: [ { match: 1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = []*        ", { rules: [ { match: 1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |one_or_more| correctly", function () {

        expect( pass ).to.changeAST( "start = .+         ", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = ''+        ", { rules: [ { match:  1 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = []+        ", { rules: [ { match: -1 } ] }, {}, {} );

    } );

    it( "calculate |match| property for |rule_ref| correctly", function () {

        expect( pass ).to.changeAST(
            [ "start = end", "end = . " ].join( "\n" ),
            { rules: [ { match:  0 }, { match:  0 } ] },
            {}, {}
        );
        expect( pass ).to.changeAST(
            [ "start = end", "end = ''" ].join( "\n" ),
            { rules: [ { match:  1 }, { match:  1 } ] },
            {}, {}
        );
        expect( pass ).to.changeAST(
            [ "start = end", "end = []" ].join( "\n" ),
            { rules: [ { match: -1 }, { match: -1 } ] },
            {}, {}
        );

        expect( pass ).to.changeAST( "start = .  start", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = '' start", { rules: [ { match:  0 } ] }, {}, {} );
        expect( pass ).to.changeAST( "start = [] start", { rules: [ { match: -1 } ] }, {}, {} );

        expect( pass ).to.changeAST( "start = . start []", { rules: [ { match: -1 } ] }, {}, {} );

    } );

} );
