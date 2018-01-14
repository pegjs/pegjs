"use strict";

const objects = require( "./objects" );

exports.noop = function noop() { };

exports.convertPasses = require( "./convert-passes" );

objects.extend( exports, objects );
