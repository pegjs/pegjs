"use strict";

const ts = require( "eslint-config-pegjs/overrides/typescript" )( __dirname );
const vue = require( "eslint-config-pegjs/overrides/vue" );

module.exports = {

    "extends": "pegjs",
    "overrides": [ ts, vue ],
    "root": true,

};
