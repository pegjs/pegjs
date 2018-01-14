"use strict";

const GrammarError = require( "../../grammar-error" );
const visitor = require( "../visitor" );
const __hasOwnProperty = Object.prototype.hasOwnProperty;

// Checks that each rule is defined only once.
function reportDuplicateRules( ast ) {

    const rules = {};

    const check = visitor.build( {
        rule( node ) {

            const name = node.name;

            if ( __hasOwnProperty.call( rules, name ) ) {

                const start = rules[ name ].start;

                throw new GrammarError(
                    `Rule "${ name }" is already defined at line ${ start.line }, column ${ start.column }.`,
                    node.location
                );

            }

            rules[ node.name ] = node.location;

        }
    } );

    check( ast );

}

module.exports = reportDuplicateRules;
