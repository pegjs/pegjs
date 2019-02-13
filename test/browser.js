"use strict";

/*
    This file is loaded through Webpack to automatically get mocha test files,
    and create a valid bundled file that executes on the browser.
*/

const context = require.context( "mocha-loader!./", true, /.+\.(spec|test)\.js?$/ );

context.keys().forEach( context );

module.exports = context;
