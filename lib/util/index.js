"use strict";

const objects = require( "./objects" );

exports.noop = function noop() { };

exports.convertPasses = require( "./convert-passes" );
exports.processOptions = require( "./process-options" );

objects.extend( exports, objects );
