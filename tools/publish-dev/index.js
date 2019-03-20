"use strict";

const cp = require( "child_process" );
const fs = require( "fs" );
const path = require( "path" );

// paths

const packagejson = require.resolve( "pegjs/package.json" );
const pegjs = path.dirname( packagejson );
const npmignore = path.join( pegjs, ".npmignore" );
const npmrc = path.join( pegjs, ".npmrc" );

// variabes

const APP = require( "./package.json" ).name;
const VERSION = require( packagejson ).version;

const {

    GIT_BRANCH,
    NPM_TOKEN,
    PR_BRANCH,

} = process.env;

let {

    GIT_COMMIT_SHA,

} = process.env;

if ( GIT_COMMIT_SHA === "not-found" ) GIT_COMMIT_SHA = GIT_BRANCH;

// local helpers

function die( err ) {

    console.error( err );
    process.exit( 1 );

}

function exec( command, print = true ) {

    const result = cp.execSync( command, {
        cwd: pegjs,
        stdio: print ? "inherit" : void 0,
    } );

    return print ? void 0 : result.toString( "utf8" );

}

// assertions

if ( PR_BRANCH !== "not-found" ) {

    console.log( "Skipping publish, PR's are not published." );
    process.exit( 0 );

}

if ( ! GIT_BRANCH ) die( "`process.env.GIT_BRANCH` is required by " + APP );
if ( ! NPM_TOKEN ) die( "`process.env.NPM_TOKEN` is required by " + APP );

// update version field in `pegjs/package.json`

const GIT_COMMIT_SHORT_SHA = exec( "git rev-parse --short " + GIT_COMMIT_SHA, false );
const dev = `${ VERSION }-${ GIT_BRANCH }.${ GIT_COMMIT_SHORT_SHA }`;

exec( `npm --no-git-tag-version -f version ${ dev }` );

// publish pegjs@dev

fs.writeFileSync( npmrc, `//registry.npmjs.org/:_authToken=${ NPM_TOKEN }` );
fs.unlinkSync( npmignore );

exec( "npm publish --tag=dev" );

fs.unlinkSync( npmrc );
