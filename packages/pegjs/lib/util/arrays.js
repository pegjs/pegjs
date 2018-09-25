"use strict";

/**
 * The `findIndex()` method returns the index of the first element in the array that satisfies the
 * provided testing function, otherwise `-1` is returned.
 */
function findIndex( array, condition ) {

    for ( let i = 0; i < array.length; ++i ) {

        if ( condition( array[ i ], i ) ) return i;

    }

    return -1;

}

/**
 * The `find()` method returns the value of the first element in the array that satisfies the
 * provided testing function, otherwise `undefined` is returned.
 */
function find( array, condition ) {

    const index = findIndex( array, condition );

    return index < 0 ? void 0 : array[ index ];

}

// Exports

module.exports = { findIndex, find };
