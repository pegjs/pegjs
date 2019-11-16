"use strict";

const { Bundler, fs, expand } = require( "../../export.utils" );

const template = require( "../../templates/editor" );

module.exports = Bundler.create( {

    script: __filename,
    check: expand( "packages" ),
    config: {

        entry: require.resolve( "pegjs" ),
        library: "peg",
        output: expand( "public/js/peg-bundle.min.js" ),

    },

    async next() {

        return template( {
            title: "Try Development Version",
            lib: "/js/peg-bundle.min.js",
            input: await fs.readFile( expand( "examples/arithmetics.pegjs" ), "utf8" ),
        } );

    },

} );
