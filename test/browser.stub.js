/* globals mocha */

"use strict";

/*
    This file is loaded through Webpack to automatically get mocha test files,
    and create a valid bundled file that executes on the browser.
*/

require( "mocha/mocha.js" );

mocha.setup( {

    reporter: "html",
    ui: "bdd",

} );

const context = require.context( "./", true, /.+\.(spec|test)\.js?$/ );

context.keys().forEach( context );

process.nextTick( () => mocha.run() );
