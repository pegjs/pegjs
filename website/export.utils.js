"use strict";

const bluebird = require( "bluebird" );
const BundlerTarget = require( "@pegjs/bundler/target" );
const cp = require( "@futagoza/child-process" );
const fse = require( "fs-extra-plus" );
const isSourceNewer = require( "@tache/is-source-newer" );
const path = require( "path" );

/**
 * This flag can be used to:
 * 
 * 1. Force building content even if it hasn't changed.
 * 2. Delete and write content instead of overwriting.
 */

const FRESH_BUILD = process.argv.includes( "--fresh" );

/**
 * A convenient object that has the following merged:
 * 
 * - The `fs-extra-plus` module
 * - The `path` module
 * - Custom overwrides of the above 2 modules
 * 
 * @type {path & fse}
 */

const fs = Object.assign( {}, path, fse, {

    copy( source, target, opts ) {

        return refresh( source, target, async () => {

            if ( FRESH_BUILD ) await fse.remove( target );

            await fse.copy( source, target, opts );

        } );

    },

} );

/**
 * A bundler wrapper that simplifies bundler interaction across child process's via async functions.
 */

const Bundler = {

    /**
     * The CLI argument used to get/set a script that actually contains the bundles config.
     */

    argv: "--get-config-from",

    /**
     * The CLI used to run the actual bundler.
     */

    cli: require.resolve( "@pegjs/bundler/bundler.js" ),

    /**
     * The property exported from a script that contains the bundler's config.
     */

    property: Symbol( "BundlerConfig" ),

    /**
     * This method must be called from a bundler's `*.js` config file to get the actual config.
     */

    load() {

        const { argv } = process;

        return require( argv[ argv.indexOf( Bundler.argv ) + 1 ] )[ Bundler.property ];

    },

    /**
     * This will create an async function that first executes the bundler if required, then calls `next`
     * 
     * @template T
     * @param {{check?: string, config: {}, cwd?: string, next: () => T, script: string, targets?: {}[]}} param0
     */

    create( { check, config, cwd = __dirname, next, script, targets } ) {

        if ( targets && ! config ) config = targets[ 0 ];

        /** @returns {Promise<T>} */

        async function executer() {

            const run = () => cp.run( "node", [ Bundler.cli, Bundler.argv, script ], { cwd } );

            await check ? refresh( check, config.output, run ) : run();

            return bluebird.method( next )();

        }

        Object.defineProperty( executer, Bundler.property, {
            get: () => targets || [ BundlerTarget( config ) ],
        } );

        return executer;

    },

    /**
     * A wrapper function to help create a configuration for the bundler.
     */

    target: BundlerTarget,

};

/**
 * Helps to cleanly get the full filesystem path of `p`.
 * 
 * @param {string} p The path to expand
 * @param {string|string[]} cwd The current working directory (prepended to `p`)
 */

function expand( p = ".", cwd = [ __dirname, ".." ] ) {

    let resolved = expand.cache[ p ];

    if ( ! resolved ) {

        if ( typeof cwd === "string" ) cwd = [ cwd ];

        const right = p
            .replace( "\\", "/" )
            .split( "/" );

        resolved = path.join( ...cwd, ...right );

        expand.cache[ p ] = resolved;

    }

    return resolved;

}

/**
 * A cache of the expanded paths.
 * 
 * @type {{ [key: string]: string }}
 */

expand.cache = {};

/**
 * Will execute `cb` if `source` is newer then `target`. Can be used to only build changed files.
 * 
 * _NOTE:_ If the `--fresh` flag is defined, this will always call `cb`
 * 
 * @template T
 * @param {string} source The source file or directory
 * @param {string} target The generated output
 * @param {(paths:{ source:string, target:string })=>Promise<T>} cb Called if `source` is newer.
 */

async function refresh( source, target, cb ) {

    const paths = { source, target };

    return FRESH_BUILD || await isSourceNewer( paths )
        ? cb( paths )
        : Promise.resolve();

}

module.exports = {

    FRESH_BUILD,

    bluebird,
    cp,
    fs,

    Bundler,
    expand,
    refresh,

};
