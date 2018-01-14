"use strict";

// type Pass = ( ast: {}, options: {} ) => void;
// type StageMap = { [string]: { [string]: Pass } };
// type PassMap = { [string]: Pass[] };
//
// The PEG.js compiler runs each `Pass` on the `PassMap` (it's 2nd argument),
// but the compiler api exposes a `StageMap` so that it is easier for plugin
// developer's to access the built-in passes.
//
// This file exposes a method that will take a `StageMap`, and return a
// `PassMap` that can then be passed to the compiler.

const objects = require( "./objects" );

function convertStage( passes ) {

    return Array.isArray( passes )
        ? passes
        : objects.values( passes );

}

function convertPasses( stages ) {

    return objects.map( stages, convertStage );

}

module.exports = convertPasses;
