"use strict";

const { fs, expand } = require( "../export.utils" );

const template = require( "../templates/article" );

module.exports = async () => template( {
    title: "Documentation",
    content: await fs.readFile( expand( "documentation.html", __dirname ), "utf8" ),
} );
