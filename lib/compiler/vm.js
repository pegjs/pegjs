"use strict";

const VM_VARS = {

    "module": true,
    "process": true,
    "VM_VARS": true,
    "PREFACE_VARS": true,
    "generateDeclaration": true,
    "runInContext": true,
    "code": true,
    "preface": true,

};

const PREFACE_VARS = Object.keys( VM_VARS )
    .map( name => `var ${ name } = void 0;` )
    .join( " " );

function generateDeclaration( name ) {

    return ( ! VM_VARS[ name ] ? "var " : "" )
        + `${ name } = vm$context.${ name };`;

}

module.exports = {

    // `eval` the given code, using properties found in `context` as top-level
    // variables, while hiding some variables in this module from the code.
    //
    // Based on `vm.runInContext` found in Node.js, this is a cross-env solution.
    runInContext( code, vm$context ) {

        let preface = PREFACE_VARS;

        if ( typeof vm$context === "object" ) {

            preface += Object.keys( vm$context )
                .map( generateDeclaration )
                .join( " " );

        }

        return eval( preface + code );


    },

};
