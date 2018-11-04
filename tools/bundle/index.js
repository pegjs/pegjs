"use strict";

const babelOptions = require( "./babelOptions" );
const ms = require( "pretty-ms" );
const rollup = require( "rollup" );
const babel = require( "rollup-plugin-babel" );
const commonjs = require( "rollup-plugin-commonjs" );
const json = require( "rollup-plugin-json" );
const multiEntry = require( "rollup-plugin-multi-entry" );
const resolve = require( "rollup-plugin-node-resolve" );
const { terser } = require( "rollup-plugin-terser" );

// pretty-path
function pp( p ) {

    return ( Array.isArray( p ) ? p.join( ", " ) : p )
        .replace( process.cwd(), "" )
        .replace( /\\/g, "/" )
        .replace( /^\//, "" );

}

// based on https://github.com/rollup/rollup/blob/master/bin/src/logging.ts
function handleError( err ) {

    let description = err.message || err;

    if ( err.name ) description = `${ err.name }: ${ description }`;

    const message = err.plugin ? `(${ err.plugin } plugin) ${ description }` : description;

    console.error( message.toString() );

    if ( err.url ) console.error( err.url );

    if ( err.loc )
        console.error( `${ err.loc.file || err.id } (${ err.loc.line }:${ err.loc.column })` );
    else if ( err.id )
        console.error( err.id );

    if ( err.frame ) console.error( err.frame );

    if ( err.stack ) console.error( err.stack );

}

module.exports = bundle => {

    const log = bundle.silent === true ? () => void 0 : console.info;

    const plugins = [
        resolve(),
        commonjs(),
        json( { namedExports: false } ),
        babel( babelOptions ),
    ];

    if ( bundle.source.includes( "*" ) ) plugins.unshift( multiEntry() );

    if ( bundle.target.endsWith( ".min.js" ) )

        plugins.push( terser( { output: { comments: /MIT License/ } } ) );

    const config = {

        input: bundle.source,
        output: {
            banner: bundle.banner,
            file: bundle.target,
            format: bundle.format || "iife",
            interop: false,
            name: bundle.name,
        },
        plugins,
        onwarn( warning, warn ) {

            if ( warning.code === "CIRCULAR_DEPENDENCY" ) return void 0;
            if ( warning.code === "NAMESPACE_CONFLICT" ) return void 0;
            if ( warning.code === "EVAL" ) return void 0;

            if ( bundle.silent !== true ) warn( warning );

        },
        treeshake: {
            propertyReadSideEffects: true,
        },
        watch: {
            exclude: "node_modules/**",
        },

    };

    if ( bundle.watch !== true ) {

        log( `@pegjs/bundle > bundling ${ pp( config.input ) }` );

        return rollup.rollup( config )
            .then( bundle => bundle.write( config.output ) )
            .then( () => {

                log( `@pegjs/bundle > created ${ pp( bundle.target ) }` );

            } )
            .catch( handleError );

    }

    const watcher = rollup.watch( config );

    // https://rollupjs.org/guide/en#rollup-watch
    watcher.on( "event", event => {

        switch ( event.code ) {

            case "BUNDLE_START":
                log( `@pegjs/bundle > watching ${ pp( event.input ) }` );
                break;

            case "BUNDLE_END":
                log( `@pegjs/bundle > created ${ pp( event.output ) } in ${ ms( event.duration ) }` );
                break;

            case "ERROR":
                handleError( event.error );
                break;

            case "FATAL":
                console.error( "@pegjs/bundle > Fatel Error!" );
                handleError( event.error );
                break;

        }

    } );

    process.on( "exit", () => watcher.close() );
    return watcher;

};
