"use strict";

const arrays = require( "./arrays" );
const js = require( "./js" );
const objects = require( "./objects" );
const vm = require( "./vm" );

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
const convertPasses = ( () => {

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

function processOptions( options, defaults ) {

    const processedOptions = {};

    objects.extend( processedOptions, options );
    objects.extend( processedOptions, defaults );

    return processedOptions;

}

module.exports = {

    find: arrays.find,
    findIndex: arrays.findIndex,

    stringEscape: js.stringEscape,
    regexpEscape: js.regexpEscape,
    reservedWords: js.reservedWords,

    clone: objects.clone,
    each: objects.each,
    extend: objects.extend,
    map: objects.map,
    values: objects.values,
    enforceFastProperties: objects.enforceFastProperties,

    evalModule: vm.evalModule,

    convertPasses,
    processOptions,
    noop() { },

};
