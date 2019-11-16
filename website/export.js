"use strict";

const { bluebird, fs, expand, refresh } = require( "./export.utils" );

( async () => {

    // Copy static content
    await fs.copy( expand( "website/assets" ), expand( "public" ) );

    // Generate pages
    await bluebird.each( fs.glob( "pages/**/*.js", __dirname ), async input => {

        const output = input
            .replace( expand( "website/pages" ), expand( "public" ) )
            .slice( 0, -3 ) + ".html";

        await refresh( input, output, async () => {

            let page = require( input );

            if ( typeof page === "function" ) page = await bluebird.method( page )();

            await fs.ensureDir( fs.dirname( output ) );
            await fs.writeFile( output, page.trim() );

        } );

    } );

} )().catch( err => {

    console.trace( err );
    process.exit( 1 );

} );
