"use strict";

const { run } = require( "@futagoza/child-process" );
const { series, src, task } = require( "@futagoza/gulpx" );
const del = require( "del" );

// Generate the grammar parser.
task( "build:parser", () =>

    run( "node packages/pegjs/bin/peg -c src/pegjs.config.js" )

);

// Delete the generated files.
task( "clean", () =>
    del( [ "packages/pegjs/dist", "website/js/*-bundle.js", "examples/*.js" ] )
);
