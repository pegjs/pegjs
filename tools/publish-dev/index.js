"use strict";

const publish = require( "./publish" );

if ( process.env.GITHUB_EVENT_NAME !== "push" ) {

    console.log( "Skipping publish because dev release's are only published on `git push`." );
    process.exit( 0 );

}

publish( "pegjs" );
