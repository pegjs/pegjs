"use strict";

const ast = require( "./ast" );
const parser = require( "./grammar" );

parser.Grammar = ast.Grammar;
parser.Node = ast.Node;

module.exports = parser;
