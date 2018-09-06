"use strict";

const babelify = require( "babelify" );
const bodyParser = require( "body-parser" );
const browserify = require( "browserify" );
const express = require( "express" );
const layout = require( "express-layout" );
const glob = require( "glob" ).sync;
const logger = require( "morgan" );
const { join } = require( "path" );

const path = ( ...parts ) => join( __dirname, ...parts );

/* Setup */

const app = express();

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

app.get( "/online", ( req, res ) => {

    res.render( "online", { title: "Online version", layout: "layout-online" } );

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

app.get( "/download", ( req, res ) => {

    res.redirect( 301, "/#download" );

} );

app.get( "/spec", ( req, res ) => {

    res.render( "spec", { title: "Spec Suite" } );

} );

app.get( "/benchmark", ( req, res ) => {

    res.render( "benchmark", { title: "Benchmark Suite" } );

} );

app.get( "/:dir/bundle.js", ( req, res ) => {

    browserify( glob( `${ __dirname }/test/${ req.params.dir }/**/*.js` ) )
        .transform( babelify )
        .bundle()
        .pipe( res );

} );

/* Main */

app.listen( 80, () => {

    console.log( "The PEG.js website is running on the localhost in %s mode...", app.get( "env" ) );

} );
