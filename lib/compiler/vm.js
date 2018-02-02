"use strict";

const vm = {

    runInContext( code, context ) {

        const peg$context = typeof context !== "undefined" ? context : {};

        /* eslint indent: 0 */
        return eval( `
            ${
                Object.keys( peg$context )
                    .map( key => `var ${ key } = peg$context.${ key };` )
                    .join( "" )
            }
            var vm = null, code = null, context = null;

            ${ code }
        ` );

    },

};

module.exports = vm;
