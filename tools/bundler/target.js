"use strict";

const dedent = require( "dedent" );
const path = require( "path" );
const webpack = require( "webpack" );

function target( { banner, entry, library, minimize, output } ) {

    const cwd = process.cwd();
    const plugins = [];

    if ( typeof banner === "string" ) {

        banner = dedent( banner );

        plugins.push( new webpack.BannerPlugin( { banner, raw: true } ) );

    }

    return {

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
