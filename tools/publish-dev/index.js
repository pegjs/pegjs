"use strict";

const publish = require( "./publish" );

const {

    BUILD_REASON,

} = process.env;

if ( BUILD_REASON && BUILD_REASON === "PullRequest" ) {

    console.log( "Skipping publish, PR's are not published." );
    process.exit( 0 );

}

publish( "pegjs" );
