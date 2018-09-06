"use strict";

const bodyParser = require( "body-parser" );
const express = require( "express" );
const layout = require( "express-layout" );
const logger = require( "morgan" );
const { join } = require( "path" );

/* Setup */

const app = express();

app.set( "views", join( __dirname, "website", "views" ) );
app.set( "view engine", "ejs" );

app.use( logger( "dev" ) );
app.use( express.static( join( __dirname, "website" ) ) );

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

/* Main */

app.listen( 3000, () => {

    console.log( "PEG.js website running at http://localhost:3000/ in %s mode...", app.get( "env" ) );

} );
