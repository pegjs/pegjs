"use strict";

const bodyParser = require( "body-parser" );
const bundle = require( "bundle" );
const express = require( "express" );
const layout = require( "express-layout" );
const logger = require( "morgan" );
const { readFileSync } = require( "fs" );
const { join } = require( "path" );

const path = ( ...parts ) => join( __dirname, "..", ...parts );

/* Setup */

const app = express();
const NODE_ENV = process.env.NODE_ENV;
const WARNINGS = process.argv.includes( "--show-warnings" );

app.set( "views", path( "website", "views" ) );
app.set( "view engine", "ejs" );

app.use( logger( "dev" ) );
app.use( express.static( path( "website" ) ) );
app.use( "/benchmark", express.static( path( "tools", "benchmark" ) ) );
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

app.get( "/development/test", ( req, res ) => {

    res.render( "test", { title: "Test Suite" } );

} );

app.get( "/development/benchmark", ( req, res ) => {

    res.render( "benchmark", { title: "Benchmark Suite" } );

} );

/* Bundle local sources (and watch for changes on non-production NODE_ENV) */

[
    { name: "benchmark", input: "tools/benchmark/browser.js" },
    { name: "peg", input: "packages/pegjs/lib/peg.js", format: "umd" },
    { name: "test", input: "test/**/*.js" },

].forEach( project => {

    bundle( {

        format: project.format,
        name: project.name,
        source: project.input,
        target: `website/js/${ project.name }-bundle.js`,
        silent: !! WARNINGS,
        watch: NODE_ENV !== "production",

    } );

} );

/* Main */

app.listen( 80, () => {

    console.log( "The PEG.js website is running on the localhost in %s mode...", app.get( "env" ) );

} );
