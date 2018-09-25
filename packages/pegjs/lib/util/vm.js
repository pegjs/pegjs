"use strict";

/**
 * `eval` the given source, using properties found in `context` as top-level variables.
 * 
 * Based on `vm.runInContext` found in Node.js, this is a cross-env solution.
 */
function runInContext( source, context ) {

    const argumentKeys = Object.keys( context );
    const argumentValues = argumentKeys.map( argument => context[ argument ] );

    const object = {};
    argumentKeys.push( "_peg$object", `_peg$object.result = ${ source };` );
    argumentValues.push( object );

    Function( ...argumentKeys )( ...argumentValues );

    return object.result;


}

// Exports

module.exports = { runInContext };
