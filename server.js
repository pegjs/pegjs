"use strict";

const bodyParser = require( "body-parser" );
const express = require( "express" );
const layout = require( "express-layout" );
const logger = require( "morgan" );
const { readFileSync } = require( "fs" );
const { join } = require( "path" );
const ms = require( "pretty-ms" );
const rollup = require( "rollup" );
const babel = require( "rollup-plugin-babel" );
const commonjs = require( "rollup-plugin-commonjs" );
const json = require( "rollup-plugin-json" );
const multiEntry = require( "rollup-plugin-multi-entry" );
const resolve = require( "rollup-plugin-node-resolve" );

const path = ( ...parts ) => join( __dirname, ...parts );
const pp = p => // pretty-path
    ( Array.isArray( p ) ? p.join( ", " ) : p )
        .replace( __dirname, "" )
        .replace( /\\/g, "/" )
        .replace( /^\//, "" );

/* Setup */

const app = express();
const NODE_ENV = process.env.NODE_ENV;
const WARNINGS = process.argv.includes( "--show-warnings" );

app.set( "views", path( "website", "views" ) );
app.set( "view engine", "ejs" );

app.use( logger( "dev" ) );
app.use( express.static( path( "website" ) ) );
app.use( "/benchmark", express.static( path( "test", "benchmark" ) ) );
app.use( "/examples", express.static( path( "examples" ) ) );

app.use( layout() );
app.use( ( req, res, next ) => {

    res.locals.req = req;
    next();

} );

app.locals.menuItem = ( req, id, title ) => {

    const className = req.path === "/" + id ? " class=\"current\"" : "";

    return `<a ${ className } href="/${ id }">${ title }</a>`;

};

/* Routes */

app.get( "/", ( req, res ) => {

    res.render( "index", { title: "" } );

} );

const LEGACY_EXAMPLE = readFileSync( path( "website", "vendor", "pegjs", "arithmetics.pegjs" ), "utf8" );
app.get( "/online", ( req, res ) => {

    res.render( "online", {

        title: "Online version",
        layout: "layout-online",
        pegjs: "/vendor/pegjs/peg.js",
        example: LEGACY_EXAMPLE,

    } );

} );

app.post( "/online/download", bodyParser.urlencoded( { extended: false, limit: "1024kb" } ), ( req, res ) => {

    res.set( "Content-Type", "application/javascript" );
    res.set( "Content-Disposition", "attachment;filename=parser.js" );
    res.send( req.body.source );

} );

app.get( "/documentation", ( req, res ) => {

    res.render( "documentation", { title: "Documentation" } );

} );

app.get( "/development", ( req, res ) => {

    res.render( "development", { title: "Development" } );

} );

const DEV_EXAMPLE = readFileSync( path( "examples", "arithmetics.pegjs" ) );
app.get( "/development/try", ( req, res ) => {

    res.render( "online", {

        title: "Online Development version",
        layout: "layout-online",
        pegjs: "/js/peg-bundle.js",
        example: DEV_EXAMPLE,

    } );

} );

app.get( "/download", ( req, res ) => {

    res.redirect( 301, "/#download" );

} );

app.get( "/spec", ( req, res ) => {

    res.render( "spec", { title: "Spec Suite" } );

} );

app.get( "/benchmark", ( req, res ) => {

    res.render( "benchmark", { title: "Benchmark Suite" } );

} );

/* Bundle local sources (and watch for changes on non-production NODE_ENV) */

const babelOptions = require( "./.babelrc" );
babelOptions.babelrc = false;
babelOptions.exclude = "node_modules/**";
babelOptions.runtimeHelpers = true;

[
    { name: "benchmark", input: "test/benchmark/**/*.js" },
    { name: "spec", input: "test/spec/**/*.js" },
    { name: "peg", input: "packages/pegjs/lib/peg.js", format: "umd" },

].forEach( bundle => {

    const plugins = [
        resolve(),
        commonjs(),
        json( { namedExports: false } ),
        babel( babelOptions ),
    ];

    if ( bundle.input.includes( "*" ) ) plugins.unshift( multiEntry() );

    const config = {

        input: bundle.input,
        output: {
            file: `website/js/${ bundle.name }-bundle.js`,
            format: bundle.format || "iife",
            name: bundle.name,
        },
        plugins,
        onwarn( warning, warn ) {

            if ( WARNINGS ) warn( warning );

        },

    };

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

    if ( NODE_ENV === "production" ) {

        rollup
            .rollup( config )
            .catch( handleError );

        return void 0;

    }

    const watcher = rollup.watch( {

        ...config,
        watch: {
            include: [
                "packages/**",
                "test/**",
            ],
        },

    } );

    // https://rollupjs.org/guide/en#rollup-watch
    watcher.on( "event", event => {

        switch ( event.code ) {

            case "BUNDLE_START":
                console.info( `pegjs-website > bundling ${ pp( event.input ) }` );
                break;

            case "BUNDLE_END":
                console.info( `pegjs-website > created ${ pp( event.output ) } in ${ ms( event.duration ) }` );
                break;

            case "ERROR":
                handleError( event.error );
                break;

            case "FATAL":
                console.error( "pegjs-website > Fatel Error!" );
                handleError( event.error );
                break;

        }

    } );

    process.on( "exit", () => watcher.close() );

} );

/* Main */

app.listen( 80, () => {

    console.log( "The PEG.js website is running on the localhost in %s mode...", app.get( "env" ) );

} );
