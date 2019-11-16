"use strict";

const dedent = require( "dedent" );
const path = require( "path" );
const webpack = require( "webpack" );

/**
 * A wrapper function to help create a configuration for Webpack.
 *
 * @param {{banner?: string, entry: string, library: string, minimize?: boolean, name?: string, output: string}} param0
 * @returns {{}}
 */

function target( { banner, entry, library, minimize, name, output } ) {

    const cwd = process.cwd();
    const plugins = [];

    if ( typeof banner === "string" ) {

        banner = dedent( banner );

        plugins.push( new webpack.BannerPlugin( { banner, raw: true } ) );

    }

    return {

        name,
        mode: process.argv.includes( "--mode=development" ) ? "development" : "production",
        entry,
        output: {
            path: path.dirname( path.resolve( cwd, output ) ),
            filename: path.basename( output ),
            library,
            libraryTarget: "umd",
            umdNamedDefine: true,
            sourcePrefix: "  ",
            globalObject: "typeof self !== 'undefined' ? self : window",
        },
        optimization: {
            minimize: minimize != null ? !! minimize : output.endsWith( ".min.js" ),
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
        plugins,

    };

}

module.exports = target;
