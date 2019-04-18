"use strict";

const cp = require( "child_process" );
const fs = require( "fs" );
const path = require( "path" );

function publish( id ) {

    // paths

    const packagejson = require.resolve( id + "/package.json" );
    const directory = path.dirname( packagejson );
    const npmignore = path.join( directory, ".npmignore" );
    const npmrc = path.join( directory, ".npmrc" );

    // variabes

    const APP = require( "./package.json" ).name;
    const VERSION = require( packagejson ).version;

    const {

        GIT_BRANCH,
        NPM_TOKEN,

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
            cwd: directory,
            stdio: print ? "inherit" : void 0,
        } );

        return print ? void 0 : result.toString( "utf8" );

    }

    // assertions

    if ( ! GIT_BRANCH ) die( "`process.env.GIT_BRANCH` is required by " + APP );
    if ( ! NPM_TOKEN ) die( "`process.env.NPM_TOKEN` is required by " + APP );

    // update version field in `<package>/package.json`

    const GIT_COMMIT_SHORT_SHA = exec( "git rev-parse --short " + GIT_COMMIT_SHA, false );
    const dev = `${ VERSION }-${ GIT_BRANCH }.${ GIT_COMMIT_SHORT_SHA }`;

    exec( `npm --no-git-tag-version -f version ${ dev }` );

    // add npm token and remove ignore file (this is a DEV release after all)

    fs.writeFileSync( npmrc, `//registry.npmjs.org/:_authToken=${ NPM_TOKEN }` );

    if ( fs.existsSync( npmignore ) ) fs.unlinkSync( npmignore );

    // publish <package>@dev

    exec( "npm publish --tag=dev" );

    fs.unlinkSync( npmrc );

}

module.exports = publish;
