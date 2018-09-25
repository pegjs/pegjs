"use strict";

/**
 * `eval` the given source as a CommonJS module, using properties found in `context` as top-level variables.
 * 
 * Based on `vm.runInContext` found in Node.js, this is a cross-env solution.
 */
function evalModule( source, context ) {

    const argumentKeys = Object.keys( context );
    const argumentValues = argumentKeys.map( argument => context[ argument ] );

    const sandbox = { exports: {} };
    argumentKeys.push( "module", "exports", source );
    argumentValues.push( sandbox, sandbox.exports );

    Function( ...argumentKeys )( ...argumentValues );

    return sandbox.exports;

}

// Exports

module.exports = { evalModule };
