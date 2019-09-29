"use strict";

const dedent = require( "dedent" );
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

function target( { entry, library, output } ) {

    const cwd = process.cwd();

    return {

        mode: process.argv.includes( "--mode=development" ) ? "development" : "production",
        entry: entry,
        output: {
            path: path.dirname( path.resolve( cwd, output ) ),
            filename: path.basename( output ),
            library: library,
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
        resolve: {
            extensions: [ ".ts", ".js" ],
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    // exclude: /node_modules/,
                    use: {
                        loader: require.resolve( "babel-loader" ),
                        options: require( "./babel.config.js" ),
                    },
                },
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                },
            ],
        },
        plugins: [
            new webpack.BannerPlugin( {
                banner: HEADER,
                raw: true,
            } ),
        ],

    };

}

module.exports = target;
