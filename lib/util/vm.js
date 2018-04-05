"use strict";

const code = ( () => {

    let preface = "";
    const MODULE_VARS = {

        "module": true,
        "process": true,
        "code": true,
        "runInContext": true,
        "source": true,
        "preface": true,

    };

    Object.keys( MODULE_VARS ).forEach( name => {

        preface += `var ${ name } = void 0;`;

    } );

    function generate( name ) {

        return `${ ( MODULE_VARS[ name ] ? "" : "var " ) + name } = __context.${ name };`;

    }

    return { generate, preface };

} )();

module.exports = {

    // `eval` the given source, using properties found in `context` as top-level
    // variables, while hiding some variables in this module from the source.
    //
    // Based on `vm.runInContext` found in Node.js, this is a cross-env solution.
    runInContext( source, __context ) {

        let preface = code.preface;

        if ( typeof __context === "object" ) {

            Object.keys( __context ).forEach( name => {

                preface += code.generate( name );

            } );

        }

        return eval( preface + source );


    },

};
