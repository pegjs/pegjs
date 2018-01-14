"use strict";

const __hasOwnProperty = Object.prototype.hasOwnProperty;
const __slice = Array.prototype.slice;

const objects = {

    // Produce's a shallow clone of the given object.
    clone( source ) {

        const target = {};

        for ( const key in source ) {

            if ( ! __hasOwnProperty.call( source, key ) ) continue;
            target[ key ] = source[ key ];

        }

        return target;

    },

    // Will loop through an object's properties calling the given function.
    //
    // NOTE:
    // This method is just a simplification of:
    //
    //   Object.keys( object ).forEach( key => value = object[ key ] )`
    //
    // It is not meant to be compatible with `Array#forEach`.
    each( object, iterator ) {

        for ( const key in object ) {

            if ( ! __hasOwnProperty.call( object, key ) ) continue;
            iterator( object[ key ], key );

        }

    },

    // This method add's properties from the source object to the target object,
    // but only if they don't already exist. It is more similar to how a native
    // class is extened then the native `Object.assign`.
    extend( target, source ) {

        for ( const key in source ) {

            if ( ! __hasOwnProperty.call( source, key ) ) continue;
            if ( __hasOwnProperty.call( target, key ) ) continue;

            target[ key ] = source[ key ];

        }
        return target;

    },

    // Is similar to `Array#map`, but, just like `each`, it is not compatible,
    // especially because it returns an object rather then an array.
    map( object, transformer ) {

        const target = {};

        for ( const key in object ) {

            if ( ! __hasOwnProperty.call( object, key ) ) continue;
            target[ key ] = transformer( object[ key ], key );

        }

        return target;

    },

    // This return's an array like `Array#map` does, but the transformer method
    // is optional, so at the same time behave's like ES2015's `Object.values`.
    values( object, transformer ) {

        const target = [];
        let index = -1;
        let key, value;

        for ( key in object ) {

            if ( ! __hasOwnProperty.call( object, key ) ) continue;
            value = object[ key ];

            target[ ++index ] = transformer
                ? transformer( value, key )
                : value;

        }

        return target;

    },

    // Will return a function that can be used to visit a specific property
    // no matter what object is passed to it.
    createVisitor( property, visit ) {

        return function visitProperty( object ) {

            visit( object[ property ], __slice.call( arguments, 1 ) );

        };

    },

};

module.exports = objects;
