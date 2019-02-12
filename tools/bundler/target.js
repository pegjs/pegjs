"use strict";

const dedent = require( "dedent" );
const glob = require( "glob" );
const path = require( "path" );
const peg = require( "pegjs" );
const webpack = require( "webpack" );

const HEADER = dedent`

    /**
     * PEG.js v${ peg.VERSION }, [hash]
     * https://pegjs.org/
     *
     * Copyright (c) 2010-2016 David Majda
     * Copyright (c) 2017+ Futago-za Ryuu
     *
     * Released under the MIT License.
     */

    /* eslint-disable */

`;

/**
 * 
 * @param {{ entry: string|{}, output: string }} param0
 */

function target( { entry, output } ) {

    if ( typeof entry !== "object" ) entry = [ entry ];

    const cwd = process.cwd();

    Object
        .keys( entry )
        .forEach( name => {

            const value = entry[ name ];

            entry[ name ] = value.includes( "*" )
                ? glob
                    .sync( value )
                    .map( p => path.join( cwd, p ) )
                : value;

        } );

    return {

        mode: process.argv.includes( "--mode=development" ) ? "development" : "production",
        entry: entry,
        output: {
            path: path.dirname( path.resolve( cwd, output ) ),
            filename: path.basename( output ),
            libraryTarget: "umd",
            umdNamedDefine: true,
            sourcePrefix: "  ",
            globalObject: "typeof self !== 'undefined' ? self : window",
        },
        optimization: {
            minimize: output.endsWith( ".min.js" ),
        },
        performance: {
            hints: false,
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: require.resolve( "babel-loader" ),
                        options: require( "./babel.config.js" ),
                    },
                },
            ],
        },
        plugins: [
            new webpack.BannerPlugin( {
                banner: HEADER,
                raw: true,
            } )
        ],

    };

}

module.exports = target;
