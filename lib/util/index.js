"use strict";

const js = require( "./js" );
const objects = require( "./objects" );
const vm = require( "./vm" );

objects.extend( exports, js );
objects.extend( exports, objects );
objects.extend( exports, vm );

exports.noop = function noop() { };

/**
 * ```ts
 * type Session = peg.compiler.Session;
 * type Pass = ( ast: {}, session: Session, options: {} ) => void;
 * type StageMap = { [string]: { [string]: Pass } };
 * type PassMap = { [string]: Pass[] };
 * ```
 * 
 * The PEG.js compiler runs each `Pass` on the `PassMap` (the `passes` option on it's 2nd
 * argument), but the compiler api exposes a `StageMap` so that it is easier for plugin
 * developer's to access the built-in passes.
 * 
 * This method takes a `StageMap`, returning a `PassMap` that can be used by the compiler.
 */
exports.convertPasses = ( () => {

    function convertStage( passes ) {

        return Array.isArray( passes )
            ? passes
            : objects.values( passes );

    }

    function convertPasses( stages ) {

        return objects.map( stages, convertStage );

    }

    return convertPasses;

} )();

exports.processOptions = function processOptions( options, defaults ) {

    const processedOptions = {};

    objects.extend( processedOptions, options );
    objects.extend( processedOptions, defaults );

    return processedOptions;

};
