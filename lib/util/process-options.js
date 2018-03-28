"use strict";

const objects = require( "./objects" );

function processOptions( options, defaults ) {

    const processedOptions = {};

    objects.extend( processedOptions, options );
    objects.extend( processedOptions, defaults );

    return processedOptions;

}

module.exports = processOptions;
